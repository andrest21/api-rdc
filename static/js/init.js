// Función para cargar el contenido dinámico
function loadContent(url) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById('app').innerHTML = html;
            if (url === 'views/login.html') {
                initLogin();
            }
            if (url === 'views/main.html') {
                initMain();
            }
        })
        .catch(error => console.error('Error cargando el contenido:', error));
}
// Verificar si el usuario tiene un JWT válido en las cookies
function checkAuth(firstLog = true) {
    fetch('/.netlify/functions/protected')
        .then(response => {
            if (response.ok) {
                if (firstLog) {
                    localStorage.setItem('log', 1);
                    Swal.fire({
                        title: "Exito",
                        text: "Login exitoso!",
                        icon: "success"
                    });
                }
                loadContent('views/main.html');
            } else if (response.status == 403) {
                loadContent('views/login.html');
            } else if (response.status == 401) {
                Swal.fire({
                    title: "Info",
                    text: "Por seguridad debe volver a iniciar sesión",
                    icon: "info"
                });
                loadContent('views/login.html');
            }
        })
        .catch(error => {
            console.error('Error verificando el token:', error);
            loadContent('views/login.html');
        });
}
// Función para inicializar el login y las pestañas
function initLogin() {
    // Inicializar el cambio de pestañas
    $('.tab a').on('click', function (e) {
        e.preventDefault();

        $(this).parent().addClass('active');
        $(this).parent().siblings().removeClass('active');

        let target = $(this).attr('href');

        $('.tab-content > div').removeClass('active');
        $(target).addClass('active');
    });
    // Inicializar catálogo de instituciones
    cargarInst();
    // Inicializar el formulario de login
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
        if (this.id == 'loginFormInst') {
            user = {
                "username": document.getElementById('superUsername').value,
                "password": document.getElementById('superUserPassword').value
            };
            url = '/.netlify/functions/auth/super-user';
        } else {
            user = {
                "id_institution": document.getElementById('institucion').value,
                "username": document.getElementById('usernameUser').value,
                "password": document.getElementById('passwordUser').value
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
        if (valid.ok) return checkAuth();
        Swal.fire({
            title: "Error",
            text: `${result.message || valid.statusText}`,
            icon: "error"
        });
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function initMain() {
    const uEnc = getCookie('userInfo');
    if (uEnc) {
        try {
            const uI = JSON.parse(decodeURIComponent(uEnc));
            document.getElementById('welcomeProfile').innerHTML = 'BIENVENIDO ' + uI.username.toUpperCase();
            document.body.style.backgroundColor = "lightgray";
            if (uI.user_admin) {
                // Ocultar secciones de quejas y catálogos
                document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'none';
                document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'none';
                document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'none';
                // Mostrar solo las secciones de administración
                document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'block';
                document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'block';
                document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'block';
                showSection('createSuperUser');
            } else if (!uI.user_admin) {
                // Ocultar secciones de quejas y catálogos
                document.querySelector(`a[onclick="showSection('sendComplaints')"]`).parentElement.parentElement.parentElement.style.display = 'block';
                document.querySelector(`a[onclick="showSection('catalogos/mediosRecepcion')"]`).parentElement.parentElement.parentElement.style.display = 'block';
                document.querySelector(`a[onclick="showSection('SEPOMEX/estados')"]`).parentElement.parentElement.parentElement.style.display = 'block';

                // Mostrar solo las secciones de administración
                document.querySelector(`a[onclick="showSection('createSuperUser')"]`).parentElement.style.display = 'none';
                document.querySelector(`a[onclick="showSection('createUser')"]`).parentElement.style.display = 'none';
                document.querySelector(`a[onclick="showSection('renewalToken')"]`).parentElement.style.display = 'none';
                showSection('sendComplaints');
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error al decodificar o analizar el JSON:', error);
        }
    } else {
        console.error('No se encontró la cookie userInfo');
    }

    $('#btnCerrarS').on('click', async function (e) {
        e.preventDefault();
        try {
            const response = await fetch('/.netlify/functions/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
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
                        Swal.fire({
                            title: "Sesión cerrada",
                            text: "Has cerrado sesión correctamente.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            localStorage.removeItem('log');
                            window.location.href = 'index.html';
                        });
                    }
                });
            } else {
                Swal.fire({
                    title: "Error",
                    text: "No se pudo cerrar la sesión.",
                    icon: "error"
                });
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Swal.fire({
                title: "Error",
                text: "Error al cerrar sesión.",
                icon: "error"
            });
        }
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
    data.forEach(institution => {
        const option = document.createElement('option');
        option.value = institution._id;
        option.text = institution.institution;
        select.appendChild(option);
    });
}

if (!localStorage.getItem('log')) {
    checkAuth();
} else {
    checkAuth(false);
}
