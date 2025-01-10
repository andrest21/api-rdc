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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })  
            .then(html => {
                contentCache[url] = html;
                appElement.innerHTML = html;
                executeScripts(url);
            })
            .catch(error => {
                console.error('Error al cargar el contenido:', error);
                appElement.innerHTML = `
                    <div class="error-container">
                        <h2>Error al cargar la vista</h2>
                        <p>Por favor, inténtalo nuevamente más tarde ó contacta directamente a soporte.</p>
                        <p><strong>Detalle:</strong> ${error.message}</p>
                    </div>`;
            });
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
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/.netlify/functions/protected');
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
                            text: "Por seguridad, vuelve a iniciar sesión.",
                            icon: "info",
                            timer: 4000,
                            showConfirmButton: false
                        }).then(() => window.location.href = 'index.html');
                    }, 3600000);
                }
                resolve();
            } else {
                reject(response.status);
            }
        } catch (error) {
            console.error('Error en la validación del token:', error);
            reject(500);
        }
    });
}

$("#swal2-input1, #swal2-input2").on('paste', function(e){
    e.preventDefault();
    alert('Esta acción está prohibida');
})
    
$("#swal2-input1, #swal2-input2").on('copy', function(e){
    e.preventDefault();
    alert('Esta acción está prohibida');
})
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
                    html: `
                        <input id="swal2-input1" class="swal2-input m-0 fs-6" type="password" maxlength="25" autocapitalize="none" autocorrect="off" style="display: flex;" placeholder="Ingrese aquí su nueva contraseña"><br/>
                        <input id="swal2-input2" class="swal2-input m-0 fs-6" type="password" maxlength="25" autocapitalize="none" autocorrect="off" style="display: flex;" placeholder="Confirme su nueva contraseña" oncopy="return false" onpaste="return false">
                    `,
                    inputAttributes: {
                        maxlength: "25",
                        autocapitalize: "off",
                        autocorrect: "off"
                    },
                    icon: "warning",
                    confirmButtonText: 'Guardar',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar',
                    cancelButtonColor: "#d33",
                    preConfirm: async () => {
                        Swal.resetValidationMessage();
                        if (document.getElementById("swal2-input1").value.trim() === ""|| document.getElementById("swal2-input2").value.trim() === ""){
                            return Swal.showValidationMessage("Por favor, escriba una nueva contraseña.");
                        }else if(document.getElementById("swal2-input1").value !== document.getElementById("swal2-input2").value){
                            return Swal.showValidationMessage("Las contraseñas no coinciden, por favor corrija.");
                        }else{
                            return document.getElementById("swal2-input1").value;
                        }   
                    }
                });
                if (password) {
                    Swal.fire({
                        title: "Advertencia",
                        html: `¿Está seguro de guardar la contraseña?`,
                        icon: "warning",
                        confirmButtonColor: "#007f4f",
                        confirmButtonText: "Si",
                        showDenyButton: true,
                        denyButtonText: 'No',
                    }).then(async (res) => {
                        if (res.isConfirmed) {
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
    document.querySelectorAll('.section-link').forEach(link => {
        const section = link.dataset.section;
        if (section === 'group1') {
            link.parentElement.style.display = uAdm === 1 ? 'block' : 'none';
        }
        if (section === 'group2') {
            link.parentElement.style.display = uAdm === 0 ? 'block' : 'none';
        }
    });
    
    if (uAdm === 1) {
        showSection('general', true);
    } else if (uAdm === 0) {
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
    console.error("Error detectado: ", msg+'||'+error);
    borrarCookies();
    Swal.fire({
        title: "Error",
        text: `${msg}:${error}`,
        icon: "error",
        showConfirmButton: true
    });
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
            text: "Por seguridad, vuelva a iniciar sesión.",
            icon: "info",
            timer: 4500,
            showConfirmButton: false
        });
    } else if (errorCode === 500) {
        return Swal.fire({
            title: "Error del Servidor",
            text: "Ha ocurrido un error. Por favor, intenta más tarde o contacte directamente a soporte.",
            icon: "error",
            timer: 5000,
            showConfirmButton: false
        });
    }
    return;
}

document.addEventListener('DOMContentLoaded', async () => {
    const appElement = document.getElementById('app');
    if (!appElement) {
        console.error("Elemento 'app' no encontrado.");
        return;
    }

    try {
        const isLoggedIn = sessionStorage.getItem('log');
        if (isLoggedIn) {
            await checkAuth(false)
                .then(() => loadContent('views/main.html'))
                .catch((errorCode) => {
                    messageErrorHandler(errorCode);
                    loadContent('views/login.html');
                });
        } else {
            loadContent('views/login.html');
        }
    } catch (error) {
        console.error('Error durante la inicialización:', error);
        loadContent('views/login.html');
    }
});