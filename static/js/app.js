//Función para validar token
function validToken() {
    fetch('/.netlify/functions/protected')
        .then(response => {
            if (response.status == 403) {
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
//Función para checar clase invalid
function checkInvalid() {
    if ($('.is-invalid').length > 0) {
        Swal.fire({
            text: "Por favor, corrija los campos inválidos antes de enviar.",
            icon: "warning"
        });
        $('.is-invalid:first').focus();
        return;
    }
}
// Función para cargar dinámicamente una sección desde un archivo HTML
function showSection(sectionId) {
    validToken();
    fetch(`./views/${sectionId}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar la vista: ${response.statusText}`);
            }
            return response.text();
        })
        .then(htmlContent => {
            // Colocar el contenido de la vista dentro del div "seccionDinamica"
            document.getElementById('seccionDinamica').innerHTML = htmlContent;

            // Eliminar la clase 'active' de todos los elementos del menú
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Añadir la clase 'active' al elemento seleccionado
            var descSecciones = ['createSuperUser', 'createUser', 'renewalToken'];
            var selectedLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
            if (descSecciones.includes(sectionId) && selectedLink) {
                selectedLink.classList.add('active');
            } else if (selectedLink) {
                selectedLink.parentElement.parentElement.previousElementSibling.classList.add('active');
            }
            initSectionLogic(sectionId);
        })
        .catch(error => {
            console.error('Error al cargar la sección:', error);
            document.getElementById('seccionDinamica').innerHTML = '<p>Error al cargar la sección.</p>';
        });
}

function initSectionLogic(sectionId) {
    //Eliminamos invalid
    $('input:not(.maskedInput)').on('keyup', function () {
        $(this).removeClass('is-invalid');
    });
    //Mascara para campos numericos
    $('input.numerico').inputmask({ mask: "9", repeat: '4' });

    //Inicializar icon eye
    $('.vpass').on('click', function () {
        let input = $(this).siblings('div').find('input');
        if (input.length === 0) input = $(this).prev('input');
        let inputType = input.attr('type');

        if (inputType === 'password') {
            input.attr('type', 'text');
            $(this).removeClass('fas fa-eye');
            $(this).addClass('far fa-eye-slash');
        } else {
            input.attr('type', 'password');
            $(this).removeClass('far fa-eye-slash');
            $(this).addClass('fas fa-eye');
        }
    });

    switch (sectionId) {
        case 'createSuperUser':
            //Inputmask
            $('#superUsername').inputmask({
                regex: "[a-zA-Z0-9]*",
                placeholder: '',
                onincomplete: function () {
                    $(this).addClass('is-invalid');
                },
                oncomplete: function () {
                    $(this).removeClass('is-invalid');
                }
            });

            //Validar contraseñas iguales de super user
            $('#superUserPassword,#confirmSuperUserPassword').on('change', function () {
                if ($('#superUserPassword').val() !== '' && $('#confirmSuperUserPassword').val() !== '') {
                    if ($('#superUserPassword').val() != $('#confirmSuperUserPassword').val()) {
                        $('#confirmSuperUserPassword').addClass('is-invalid');
                    }else{
                        $("#confirmNewPassword").removeClass('is-invalid');
                    }
                }
            });
            //Submit super user form
            $('#createSuperUserForm').on('submit', async function (e) {
                e.preventDefault();
                checkInvalid();

                const newSuperUser = {
                    "key": document.getElementById('redecoKey').value,
                    "username": document.getElementById('superUsername').value,
                    "password": document.getElementById('superUserPassword').value,
                    "confirm_password": document.getElementById('confirmSuperUserPassword').value
                };
                
                try {
                    const response = await fetch('/.netlify/functions/auth/create-super-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newSuperUser)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        Swal.fire({
                            title: "Token Access Generado",
                            html: `Token:<b>${result.token_access}</b> <br>Guarde la llave en algun lugar seguro.`,
                            icon: "success"
                        }).then((result) => {
                            if (result.isConfirmed) {
                                Swal.fire({
                                    title: "Advertencia",
                                    html: `¿Se aseguro de guardar la llave? <br>Esta llave no se volvera a mostrar.`,
                                    icon: "warning",
                                    confirmButtonColor: "#007f4f",
                                    confirmButtonText: "Si",
                                    showDenyButton: true,
                                    denyButtonText: 'No',
                                }).then((res) => {
                                    if (res.isDenied) {
                                        Swal.fire({
                                            title: `Token: <b>${result.token_access}</b>`,
                                            text: `Guarde la llave en algun lugar seguro.`
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: `${result.message || response.statusText}`,
                            icon: "error"
                        });
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            });
            break;
        case 'createUser':
            //Submit user form
            $('#createUserForm').on('submit', async function (e) {
                e.preventDefault();
                checkInvalid();
                const userInfoEncoded = getCookie('userInfo');
                const userInfo = JSON.parse(decodeURIComponent(userInfoEncoded));
                const newUser = {
                    "token_access": document.getElementById('instTokenAccess').value,
                    "username": document.getElementById('newUsername').value,
                    "password": document.getElementById('newPassword').value,
                    "confirm_password": document.getElementById('confirmNewPassword').value,
                    "id_institution": userInfo.institution
                };
                try {
                    $('button[type="submit"]').prop('disabled',true);
                    // const response = await fetch('/.netlify/functions/auth/create-user', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify(newUser)
                    // });
                    // const result = await response.json();
                    // if (response.ok) {
                    const response = true;
                    if (response) {
                        Swal.fire({
                            title: "Exito",
                            html: `Usuario Creado Correctamente`,
                            icon: "success",
                            timer: 2000
                        });
                        $('#confirmNewPassword').removeClass('is-invalid');
                        $('#createUserForm').trigger("reset");
                        $('button[type="submit"]').prop('disabled',false);
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: `${result.message || response.statusText}`,
                            icon: "error"
                        });
                        $('#confirmNewPassword').removeClass('is-invalid');
                        $('#createUserForm').trigger("reset");
                        $('button[type="submit"]').prop('disabled',false);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    $('#confirmNewPassword').removeClass('is-invalid');
                    $('#createUserForm').trigger("reset");
                    $('button[type="submit"]').prop('disabled',false);
                }
            });

            //Validar contraseñas de usuarios iguales
            $('#newPassword,#confirmNewPassword').on('change', function () {
                if ($('#newPassword').val() !== '' && $('#confirmNewPassword').val() !== '') {
                    if ($('#newPassword').val() != $('#confirmNewPassword').val()) {
                        $('#confirmNewPassword').addClass('is-invalid');
                    }else{
                        $("#confirmNewPassword").removeClass('is-invalid');
                    }
                }
            });

            break;
        case 'renewalToken':
            //Submit renovar token de usuario
            $('#renewalTokenForm').on('submit', async function (e) {
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
            break;
        case 'sendComplaints':
            //Submit Quejas
            $('#sendComplaintsForm').on('submit', async function (e) {
                e.preventDefault();

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
            //Cargar catalogos
            // URLs de las APIs
            const medioRecepcionAPI = "https://api.condusef.gob.mx/catalogos/medio-recepcion";
            const nivelAtencionAPI = "https://api.condusef.gob.mx/catalogos/niveles-atencion";
            const estadosAPI = "https://api.condusef.gob.mx/sepomex/estados/";

            // Elementos select
            const medioSelect = document.getElementById("QuejasMedio");
            const nivelATSelect = document.getElementById("QuejasNivelAT");
            const estadosSelect = document.getElementById("QuejasEstados");

            // Cargar los catálogos dinámicamente al cargar la página
            cargarCatalogoSelect(medioRecepcionAPI, medioSelect, 'medio', 'medioId', 'medioDsc');
            cargarCatalogoSelect(nivelAtencionAPI, nivelATSelect, 'nivelesDeAtencion', 'nivelDeAtencionId', 'nivelDeAtencionDsc');
            cargarCatalogoSelect(estadosAPI, estadosSelect, 'estados', 'claveEdo', 'estado');

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
                cargarCatalogoSelect(cpAPI, cpSelect, 'codigos_postales', 'codigo_sepomex', 'codigo_sepomex', 'QuejasCP');
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
                    cargarCatalogoSelect(municipiosAPI, municipiosSelect, 'municipios', 'municipioId', 'municipio', 'QuejasMunId');
                    const coloniasAPI = "https://api.condusef.gob.mx/sepomex/colonias/?cp=" + $('#QuejasCP').val();
                    const coloniasSelect = document.getElementById("QuejasColId");
                    cargarCatalogoSelect(coloniasAPI, coloniasSelect, 'colonias', 'coloniaId', 'colonia', 'QuejasColId');
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
                    cargarCatalogoSelect(coloniasAPI, localidadInput, 'colonias', 'tipoLocalidadId', 'tipoLocalidad', 'QuejasLocId', true, coloniaId, municipioId);
                }
            });
            break;
        case 'findComplaints':
            break;
        case 'delComplaints':
            break;
        case 'catalogos/mediosRecepcion':
            break;
        case 'catalogos/nivelesAtencion':
            break;
        case 'catalogos/productos':
            break;
        case 'catalogos/causas':
            break;
        case 'SEPOMEX/estados':
            const estAPI = "https://api.condusef.gob.mx/sepomex/estados/";
            cargarCatalogo(estAPI, 'estados', ['claveEdo', 'estado']);
            break;
        case 'SEPOMEX/codigosPostales':
            const edoSelect = document.getElementById("clvEdo");
            const edoAPI = "https://api.condusef.gob.mx/sepomex/estados/";
            cargarCatalogoSelect(edoAPI, edoSelect, 'estados', 'claveEdo', 'estado');
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvEdo = $('#clvEdo').val();
                if (clvEdo !== '') {
                    const cpAPI = "https://api.condusef.gob.mx/sepomex/codigos-postales/?estado_id=" + clvEdo;
                    cargarCatalogo(cpAPI, 'codigos_postales', ['estado', 'codigo_sepomex']);
                    $('#tableCP').show();
                }
            });
            $('#clvEdo').on('change', function () {
                $('#tableCP').hide();
            });

            break;
        case 'SEPOMEX/municipios':
            break;
        case 'SEPOMEX/colonias':
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvCP = $('#clvCP').val();
                if (clvCP !== '') {
                    const colAPI = "https://api.condusef.gob.mx/sepomex/colonias/?cp=" + clvCP;
                    cargarCatalogo(colAPI, 'colonias', ['estadoId', 'estado', 'municipioId', 'municipio', 'coloniaId', 'colonia', 'tipoLocalidadId', 'tipoLocalidad'], false);
                    $('#tableCol').show();
                }
            });
            $('#clvCP').on('change', function () {
                $('#tableCol').hide();
            });
            break;
        default:
            break;
    }
};

// Función para cargar los datos de la API en un select
function cargarCatalogoSelect(url, selectElement, key, idField, textField, disabledField = "", setLocalidad = false, colonia = "", municipio = "") {
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

function cargarCatalogo(url, key, columns, addClassCol = true) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector(".table100 tbody");
            tableBody.innerHTML = ""; // Limpiar cualquier dato existente en la tabla

            // Iterar sobre los datos obtenidos usando la clave correcta
            data[key].forEach(item => {
                const row = document.createElement("tr");
                row.classList.add("row100", "body");
                var iter = 1;
                // Iterar sobre las columnas especificadas
                columns.forEach(col => {
                    const cell = document.createElement("td");
                    if (addClassCol || iter == 1) {
                        cell.classList.add("cell100", "column" + iter);
                    } else {
                        cell.classList.add("cell100");
                    }
                    cell.textContent = item[col]; // Asignar el valor del campo correspondiente
                    row.appendChild(cell); // Añadir la celda a la fila
                    iter++;
                });

                tableBody.appendChild(row); // Añadir la fila al cuerpo de la tabla
            });
        })
        .catch(error => console.error('Error al cargar el catálogo:', error));
}