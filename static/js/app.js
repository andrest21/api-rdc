//Eliminamos invalid
$('input:not(.maskedInput)').on('keyup', function () {
    $(this).removeClass('is-invalid');
});

// Función para mostrar la sección seleccionada
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });

    // Reiniciar Form
    document.getElementById(sectionId + 'Form').reset();
    $('input').removeClass('is-invalid');
    document.getElementById('tokenDisplay').style.display = "none";
    document.getElementById('userCreateResponse').style.display = "none";

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).style.display = 'block';

    // Eliminar la clase 'active' de todos los elementos del menú
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Añadir la clase 'active' al elemento seleccionado
    var descSecciones = ['sendComplaints', 'findComplaints', 'delComplaints'];
    var selectedLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (descSecciones.includes(sectionId) && selectedLink) {
        selectedLink.parentElement.parentElement.previousElementSibling.classList.add('active');
    } else if (selectedLink) {
        selectedLink.classList.add('active');
    }
}

//Validar contraseñas iguales de super user
$('#superUserPassword,#confirmSuperUserPassword').on('change', function () {
    if ($('#superUserPassword').val() !== '' && $('#confirmSuperUserPassword').val() !== '') {
        if ($('#superUserPassword').val() != $('#confirmSuperUserPassword').val()) {
            $('#confirmSuperUserPassword').addClass('is-invalid');
        }
    }
});

//Validar contraseñas de usuarios iguales
$('#newPassword,#confirmNewPassword').on('change', function () {
    if ($('#newPassword').val() !== '' && $('#confirmNewPassword').val() !== '') {
        if ($('#newPassword').val() != $('#confirmNewPassword').val()) {
            $('#confirmNewPassword').addClass('is-invalid');
        }
    }
});

//Inputmask
$('#superUsername,#newUsername').inputmask({
    regex: "[a-zA-Z0-9]*",
    placeholder: '',
    onincomplete: function () {
        $(this).addClass('is-invalid');
    },
    oncomplete: function () {
        $(this).removeClass('is-invalid');
    }
});

$('input.numerico').inputmask({ mask: "9", repeat: '4' });


//Crear super usuario
document.getElementById('createSuperUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const newSuperUser = {
        "key": document.getElementById('redecoKey').value,
        "username": document.getElementById('superUsername').value,
        "password": document.getElementById('superUserPassword').value,
        "confirm_password": document.getElementById('confirmSuperUserPassword').value
    };

    try {
        const response = await fetch('https://api.condusef.gob.mx/auth/users/create-super-user/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newSuperUser)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('tokenDisplay').style.display = "block";
            document.getElementById('tokenDisplay').innerText = 'Token: ' + result.data.token_access + '<br> Guarde la llave en algun lugar seguro.';
        } else {
            document.getElementById('tokenDisplay').style.display = "block";
            document.getElementById('tokenDisplay').innerText = 'Error: ' + JSON.stringify(result);
        }

    } catch (error) {
        console.error('Error:', error);
    }
});

//Crear usuario
document.getElementById('createUserForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const newUser = {
        "username": document.getElementById('newUsername').value,
        "password": document.getElementById('newPassword').value,
        "confirm_password": document.getElementById('confirmNewPassword').value
    };

    // const token = localStorage.getItem('token_access');
    const token = document.getElementById('instTokenAccess').value;

    try {
        const response = await fetch('https://api.condusef.gob.mx/auth/users/create-user/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('userCreateResponse').style.display = "block";
            document.getElementById('userCreateResponse').innerText = 'Usuario creado exitosamente';
        } else {
            document.getElementById('userCreateResponse').style.display = "block";
            document.getElementById('userCreateResponse').innerText = 'Error: ' + JSON.stringify(result);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

//Generar token de usuario
document.getElementById('renewalTokenForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evita el envío del formulario

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const authData = {
        "username": username,
        "password": password
    };

    try {
        const response = await fetch('https://api.condusef.gob.mx/auth/users/token/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(authData)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('tokenDisplay').innerText = 'Token: ' + result.user.token_access;
            localStorage.setItem('token_access', result.user.token_access);
        } else {
            document.getElementById('tokenDisplay').innerText = 'Error: ' + result.msg;
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

//Cargar catalogos
document.querySelector(`[onclick="showSection('sendComplaints')"]`).addEventListener('click', function () {
    // URLs de las APIs
    const medioRecepcionAPI = "https://api.condusef.gob.mx/catalogos/medio-recepcion";
    const nivelAtencionAPI = "https://api.condusef.gob.mx/catalogos/niveles-atencion";
    const estadosAPI = "https://api.condusef.gob.mx/sepomex/estados/";
    // const municipiosAPI = "https://api.condusef.gob.mx/sepomex/municipios";
    // Elementos select
    const medioSelect = document.getElementById("QuejasMedio");
    const nivelATSelect = document.getElementById("QuejasNivelAT");
    const estadosSelect = document.getElementById("QuejasEstados");
    // const municipiosSelect = document.getElementById("QuejasMunId");

    // Cargar los catálogos dinámicamente al cargar la página
    cargarCatalogo(medioRecepcionAPI, medioSelect, 'medio', 'medioId', 'medioDsc');
    cargarCatalogo(nivelAtencionAPI, nivelATSelect, 'nivelesDeAtencion', 'nivelDeAtencionId', 'nivelDeAtencionDsc');
    cargarCatalogo(estadosAPI, estadosSelect, 'estados', 'claveEdo', 'estado');
});

//Cargar codigos postales
$('#QuejasEstados').on('change', function () {
    const cpAPI = "https://api.condusef.gob.mx/sepomex/codigos-postales/?estado_id=" + $('#QuejasEstados').val();
    const cpSelect = document.getElementById("QuejasCP");
    $('#QuejasCP').attr('disabled', true);
    $('#QuejasMunId').attr('disabled', true);
    $('#QuejasColId').attr('disabled', true);
    $('#QuejasLocId').attr('disabled', true);
    $('#QuejasLocId').val('');
    $('#hiddenLocId').val('');
    cargarCatalogo(cpAPI, cpSelect, 'codigos_postales', 'codigo_sepomex', 'codigo_sepomex', 'QuejasCP');
});

//Cargar municipios y colonias
$('#QuejasCP').on('change', function () {
    $('#QuejasMunId').attr('disabled', true);
    $('#QuejasColId').attr('disabled', true);
    $('#QuejasLocId').attr('disabled', true);
    $('#QuejasLocId').val('');
    $('#hiddenLocId').val('');
    if ($('#QuejasEstados').val() !== '') {
        const municipiosAPI = "https://api.condusef.gob.mx/sepomex/municipios/?estado_id=" + $('#QuejasEstados').val() + "&cp=" + $('#QuejasCP').val();
        const municipiosSelect = document.getElementById("QuejasMunId");
        cargarCatalogo(municipiosAPI, municipiosSelect, 'municipios', 'municipioId', 'municipio', 'QuejasMunId');
        const coloniasAPI = "https://api.condusef.gob.mx/sepomex/colonias/?cp=" + $('#QuejasCP').val();
        const coloniasSelect = document.getElementById("QuejasColId");
        cargarCatalogo(coloniasAPI, coloniasSelect, 'colonias', 'coloniaId', 'colonia', 'QuejasColId');
    }
});

// Cargar localidad
$('#QuejasColId,#QuejasMunId').on('change', function () {
    $('#QuejasLocId').attr('disabled', true);
    $('#QuejasLocId').val('');
    $('#hiddenLocId').val('');
    if ($('#QuejasColId').val() !== '' && $('#QuejasMunId').val() !== '') {
        const coloniaId = $('#QuejasColId').val();
        const municipioId = $('#QuejasMunId').val();
        const coloniasAPI = "https://api.condusef.gob.mx/sepomex/colonias/?cp=" + $('#QuejasCP').val();
        const localidadInput = document.getElementById("QuejasLocId");
        cargarCatalogo(coloniasAPI, localidadInput, 'colonias', 'tipoLocalidadId', 'tipoLocalidad', 'QuejasLocId', true, coloniaId, municipioId);
    }
});

// Función para cargar los datos de la API en un select
function cargarCatalogo(url, selectElement, key, idField, textField, disabledField = "", setLocalidad = false, colonia = "", municipio = "") {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data[key] != '') {
                // Limpia el select
                selectElement.innerHTML = '<option value="">Seleccione una opción</option>';
                if (setLocalidad) {
                    selectElement.innerHTML = '';
                }
                // Llena el select con los datos del catálogo
                data[key].forEach(item => {
                    if (setLocalidad && item['coloniaId'] == colonia && item['municipioId'] == municipio) {
                        document.getElementById('hiddenLocId').value = item[idField]; // Asigna el ID como valor del input
                        selectElement.value = item[textField]; // Asigna la descripcion al input
                    } else {
                        const option = document.createElement("option");
                        option.value = item[idField]; // Asigna el ID como valor de la opción
                        option.textContent = item[textField]; // Asigna la descripción como texto
                        selectElement.appendChild(option);
                    }
                });
                //Habilitamos campo al que afecta
                if (disabledField !== '') {
                    $('#' + disabledField).attr('disabled', false);
                }
            } else {
                if (disabledField !== '') {
                    $('#' + disabledField).attr('disabled', true);
                }
                selectElement.innerHTML = '<option value="">No existen valores</option>';
            }
        })
        .catch(error => console.error('Error al cargar el catálogo:', error));
}

//Enviar Quejas
document.getElementById('sendComplaintsForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evita el envío del formulario

    // const token = localStorage.getItem('token_access');
    const token = document.getElementById('instTokenAccess').value;
    if (!token) {
        alert('Primero debes obtener el token.');
        return;
    }

    const complaintData = {
        "QuejasDenominacion": document.getElementById('denominacion').value,
        "QuejasSector": document.getElementById('sector').value,
        "QuejasNoMes": parseInt(document.getElementById('mes').value),
        "QuejasFolio": document.getElementById('folio').value
    };

    try {
        const response = await fetch('https://api.condusef.gob.mx/redeco/quejas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(complaintData)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('responseDisplay').innerText = 'Respuesta: ' + JSON.stringify(result);
        } else {
            document.getElementById('responseDisplay').innerText = 'Error: ' + JSON.stringify(result.errors);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});