const contentCache = {};

function loadContent(url) {
    const appElement = document.getElementById('app');
    if (!appElement) {
        console.error('Elemento "app" no encontrado.');
        return;
    }
    if (contentCache[url]) {
        document.getElementById('app').innerHTML = contentCache[url];
        executeScripts(url);
    } else {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                contentCache[url] = html;
                appElement.innerHTML = html;
                executeScripts(url);
            })
            .catch(error => console.error('Error cargando el contenido:', error));
    }
}

function executeScripts(url) {
    if (url === 'views/login.html') {
        initLogin();
    }
    if (url === 'views/main.html') {
        setTimeout(initMain, 0);
    }
    $('#spinner').addClass('d-none');
}

function checkAuth(firstLog) {
    return new Promise((resolve, reject) => {
        fetch('/.netlify/functions/protected')
            .then(response => {
                if (response.ok) {
                    if (firstLog) {
                        sessionStorage.setItem('log', 1);
                        Swal.fire({
                            title: "Éxito",
                            text: "Login exitoso!",
                            icon: "success",
                            timer: 3000
                        });
                        setTimeout(() => {
                            sessionStorage.clear();
                            fetch('/.netlify/functions/auth/logout', {
                                method: 'POST',
                            });
                            Swal.fire({
                                title: "Sesión Expirada",
                                text: "Por seguridad, por favor vuelve a iniciar sesión.",
                                icon: "info",
                                timer: 3000,
                                showConfirmButton: false
                            }).then((result) => {
                                window.location.href = 'index.html';
                            });
                        }, 3600000);
                    }
                    resolve();
                } else if (response.status == 403) {
                    if(firstLog){
                        reject();
                    }else{
                        reject(403);
                    }
                } else if (response.status == 401) {
                    reject(401);
                }
            })
            .catch(error => {
                console.error('Error verificando el token:', error);
                reject(500);
            });
    });
}

function initLogin() {
    $('footer').css('display', 'none');
    $('body').css('background-color', '');
    $('.tab a').on('click', function (e) {
        e.preventDefault();

        $(this).parent().addClass('active');
        $(this).parent().siblings().removeClass('active');

        let target = $(this).attr('href');

        $('.tab-content > div').removeClass('active');
        $(target).addClass('active');
    });
    
    $('#loginFormInst,#loginFormUser').on('submit', async function (e) {
        e.preventDefault();
        if ($('.is-invalid').length > 0) {
            Swal.fire({
                text: "Por favor, corrija los campos inválidos antes de enviar.",
                icon: "warning"
            });
            $('.is-invalid:first').focus();
            return;
        }
        let user = {};
        let url = "";
        $('#spinner').removeClass('d-none');
        if (this.id == 'loginFormInst') {
            user = {
                "id_institution": document.getElementById('institucion').value.trim(),
                "username": document.getElementById('superUsername').value.trim(),
                "password": document.getElementById('superUserPassword').value.trim()
            };
            url = '/.netlify/functions/auth/super-user';
        } else {
            user = {
                "id_institution": document.getElementById('institucion2').value.trim(),
                "username": document.getElementById('usernameUser').value.trim(),
                "password": document.getElementById('passwordUser').value.trim()
            };
            url = '/.netlify/functions/auth/user';
        }

        const valid = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });
        const result = await valid.json();

        if (valid.ok) {
            checkAuth(true)
                .then(() => {
                    sessionStorage.setItem('uA',JSON.stringify(result.data));
                    loadContent('views/main.html');
                })
                .catch((errorCode) => {
                    sessionStorage.clear();
                    messageErrorHandler(errorCode);
                    setTimeout(() => {
                        loadContent('views/login.html');
                    }, 2000);
                });
        } else if (result.status == 'expired') {
            $('#spinner').addClass('d-none');
            Swal.fire({
                title: "Advertencia",
                text: `${result.message}`,
                icon: "warning"
            }).then(async () => {
                const { value: password } = await Swal.fire({
                    title: "Cambio de Contraseña",
                    text: "Por favor, ingresa una nueva contraseña",
                    input: "password",
                    inputAttributes: {
                        maxlength: "25",
                        autocapitalize: "off",
                        autocorrect: "off"
                    },
                    inputPlaceholder: "Ingrese aquí su nueva contraseña",
                    icon: "warning",
                    confirmButtonText: 'Guardar',
                    showCancelButton: true,
                    cancelButtonText: 'No Guardar',
                    cancelButtonColor: "#d33",
                });
                if (password) {
                    $('#spinner').removeClass('d-none');
                    user['new_password'] = password;
                    const response = await fetch('/.netlify/functions/auth/cpsw', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(user)
                    });

                    const result = await response.json();
        
                    if (response.ok) {
                        $('#spinner').addClass('d-none');
                        Swal.fire({
                            title: "Éxito",
                            text: `${result.message}`,
                            icon: "success",
                            timer: 3000
                        });
                        loadContent('views/login.html');
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: `${result.message || valid.statusText}`,
                            icon: "error"
                        });
                    }
                }
            });
        } else {
            $('#spinner').addClass('d-none');
            Swal.fire({
                title: "Error",
                text: `${result.message || valid.statusText}`,
                icon: "error"
            });
        }
    });
}


function initMain() {
    if (!document.getElementById('welcomeProfile')) {
        console.error('Elemento "welcomeProfile" no encontrado.');
        return;
    }

    let uName = "";
    let uAdm = 3;
    
    if (sessionStorage.getItem('uA')) {
        const uAstring = sessionStorage.getItem('uA');
        try {
            const uA = JSON.parse(uAstring);
            uName = uA.username || "";
            uAdm = uA.is_admin;
            if (uName !== "") {
                document.getElementById('welcomeProfile').innerHTML = 
                    'Sesión Iniciada: ' + uName.toUpperCase(); 
            }
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            borrarCookies();
            return loadContent('views/login.html');
        }
    } else {
        borrarCookies();
        return loadContent('views/login.html');
    }
    document.body.style.backgroundColor = "lightgray";
    if (uAdm === 1) {
        document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('general')"]`).parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'block';
        showSection('general', true);
    } else if (uAdm === 0) {
        document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('general')"]`).parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'none';
        showSection('sendComplaints', true);
    } else {
        document.body.style.backgroundColor = "";
        borrarCookies();
        return loadContent('views/login.html');
    }

    $('footer').css('display', 'block');
    $('#btnCerrarS').on('click', function (e) {
        e.preventDefault();
        Swal.fire({
            title: "Advertencia",
            html: `¿Está seguro de cerrar sesión?`,
            icon: "warning",
            confirmButtonColor: "#007f4f",
            confirmButtonText: "Si",
            showDenyButton: true,
            denyButtonText: 'No',
        }).then((res) => {
            if (res.isConfirmed) {
                fetch('/.netlify/functions/auth/logout', {
                    method: 'POST',
                }).then(response => {
                    if (response.ok) {
                        Swal.fire({
                            title: "Sesión cerrada",
                            text: "Has cerrado sesión correctamente.",
                            icon: "success",
                            timer: 3000,
                            showConfirmButton: false
                        }).then(() => {
                            sessionStorage.clear();
                            loadContent('views/login.html');
                        });
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: "No se pudo cerrar la sesión.",
                            icon: "error"
                        });
                    }
                }).catch(error => {
                    console.error('Error al cerrar sesión:', error);
                    Swal.fire({
                        title: "Error",
                        text: "Error al cerrar sesión.",
                        icon: "error"
                    });
                });
            }
        });
    });

    emailjs.init({
        publicKey: 'PGcYIdNnGCPsrtNj5',
        privateKey: 'kQBFBho2GoOSFoVlWGczM'
    });
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("Error detectado: ", msg);
    borrarCookies();
};

function borrarCookies() {
    sessionStorage.clear();
    fetch('/.netlify/functions/auth/logout', {
        method: 'POST',
    });
    return false;
}

function messageErrorHandler(errorCode) {
    borrarCookies();
    if (errorCode === 401 || errorCode === 403) {
        return Swal.fire({
            title: "Sesión Expirada",
            text: "Por seguridad, por favor vuelve a iniciar sesión.",
            icon: "info",
            timer: 4000,
            showConfirmButton: false
        });
    } else if (errorCode === 500) {
        return Swal.fire({
            title: "Error del Servidor",
            text: "Ha ocurrido un error. Por favor, intenta más tarde.",
            icon: "error",
            timer: 4000,
            showConfirmButton: false
        });
    }
    return;
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('log')) {
        loadContent('views/main.html');
    } else {
        loadContent('views/login.html');
    }
});