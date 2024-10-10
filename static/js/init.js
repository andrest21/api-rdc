const contentCache = {};

function loadContent(url) {
    if (contentCache[url]) {
        document.getElementById('app').innerHTML = contentCache[url];
        executeScripts(url);
    } else {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                contentCache[url] = html;
                document.getElementById('app').innerHTML = html;
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
        initMain();
    }
    $('#spinner').addClass('d-none');
}

function checkAuth(firstLog, reload = true) {
    return new Promise((resolve, reject) => {
        fetch('/.netlify/functions/protected')
            .then(response => {
                if (response.ok) {
                    if (!sessionStorage.getItem('is_admin') || !sessionStorage.getItem('username')) {
                        reject(403);
                    } else {
                        if (firstLog) {
                            sessionStorage.setItem('log', 1);
                            Swal.fire({
                                title: "Exito",
                                text: "Login exitoso!",
                                icon: "success",
                                timer: 3000
                            });
                            setTimeout(() => {
                                sessionStorage.removeItem('is_admin');
                                sessionStorage.removeItem('username');
                                sessionStorage.removeItem('log');
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
                        if (reload) {
                            resolve();
                        } else {
                            resolve();
                        }
                    }
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
    cargarInst();
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
                "username": document.getElementById('superUsername').value.trim(),
                "password": document.getElementById('superUserPassword').value
            };
            url = '/.netlify/functions/auth/super-user';
            sessionStorage.setItem('is_admin', 1);
        } else {
            user = {
                "id_institution": document.getElementById('institucion').value,
                "username": document.getElementById('usernameUser').value.trim(),
                "password": document.getElementById('passwordUser').value
            };
            url = '/.netlify/functions/auth/user';
            sessionStorage.setItem('is_admin', 0);
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
            sessionStorage.setItem('username', user.username);
            checkAuth(true)
                .then(() => {
                    loadContent('views/main.html');
                })
                .catch((errorCode) => {
                    sessionStorage.removeItem('is_admin');
                    sessionStorage.removeItem('username');
                    sessionStorage.removeItem('log');
                    messageErrorHandler(errorCode);
                    setTimeout(() => {
                        loadContent('views/login.html');
                    }, 2000);
                });
        } else {
            sessionStorage.removeItem('is_admin');
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
    const uName = sessionStorage.getItem('username');
    const uA = sessionStorage.getItem('is_admin');
    document.getElementById('welcomeProfile').innerHTML = 'BIENVENIDO ' + uName.toUpperCase();
    document.body.style.backgroundColor = "lightgray";
    if (uA === '1') {
        document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'block';
        showSection('createSuperUser', true);
    } else if (uA === '0') {
        document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'block';
        document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'none';
        document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'none';
        showSection('sendComplaints', true);
    } else {
        loadContent('views/login.html');
    }

    $('footer').css('display', 'block');
    $('#btnCerrarS').on('click', function (e) {
        e.preventDefault();
        Swal.fire({
            title: "Advertencia",
            html: `¿Esta seguro de cerrar sesión?`,
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

// Inicializar catálogo de instituciones
function cargarInst() {
    const insCache = sessionStorage.getItem('inst');
    if (insCache) {
        const data = JSON.parse(insCache);
        cargarInsSelect(data);
    } else {
        fetch('/.netlify/functions/auth/institutions')
            .then(response => response.json())
            .then(data => {
                sessionStorage.setItem('inst', JSON.stringify(data));
                cargarInsSelect(data);
            })
            .catch(error => console.error('Error al cargar las instituciones:', error));
    }
}

// Función que carga las instituciones en el select
function cargarInsSelect(data) {
    const select = document.getElementById('institucion');
    select.setAttribute("style", "color:#929292;");
    data.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution._id;
        option.text = institution.institution;
        select.appendChild(option);
    });

    select.addEventListener("change", function () {
        let selectedOption = this.options[select.selectedIndex];
        if (selectedOption.value !== '*') {
            select.setAttribute("style", "color:white;");
        } else {
            select.setAttribute("style", "color:#929292;");
        }

    });
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.log("Error detectado: ", msg);
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
    if (errorCode === 401) {
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

checkAuth(false)
.then(() => {
    loadContent('views/main.html');
})
.catch((errorCode) => {
    sessionStorage.removeItem('is_admin');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('log');
    messageErrorHandler(errorCode);
    setTimeout(() => {
        loadContent('views/login.html');
    }, 1000);
});
