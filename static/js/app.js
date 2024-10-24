function checkInvalid() {
    if ($('.is-invalid').length > 0) {
        Swal.fire({
            text: "Por favor, corrija los campos inválidos antes de enviar.",
            icon: "warning"
        });
        $('.is-invalid:first').focus();
        return false;
    }
    return true;
}

function validateForm(data) {
    let isValid = true;
    for (const field in data) {
        const fieldValue = data[field];
        const inputField = $('#' + field);

        if (fieldValue === false) {
            inputField.addClass('is-invalid');
            isValid = false;
        } else {
            inputField.removeClass('is-invalid');
        }
    }
    return isValid;
}

function loadSection(sectionId) {
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
            var descSecciones = ['createSuperUser', 'createUser', 'renewalToken', 'contacto'];
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

function showSection(sectionId, isfirst = false) {
    //Validamos si es carga inicial de pagina
    if (!isfirst) {
        checkAuth(false, false).then(() => {
            loadSection(sectionId);
        }).catch((errorCode) => {
            sessionStorage.removeItem('is_admin');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('log');
            messageErrorHandler(errorCode);
            setTimeout(() => {
                loadContent('views/login.html');
            }, 2000);
        });
    } else {
        loadSection(sectionId);
    }
}

function initSectionLogic(sectionId) {
    //Eliminamos invalid
    $('input:not(.maskedInput)').on('keyup', function () {
        $(this).removeClass('is-invalid');
    });
    //Mascara para campos numericos
    $('input.numerico').inputmask({ mask: "9", repeat: '4' });
    //Mascara para campos numericos
    $('input.edadInputMask').inputmask('numeric', { min: '0', max: '150', clearMaskOnLostFocus: true });
    //Mascara para codigos postales
    $('input.cp').inputmask({ mask: "9", repeat: '5' });
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
            $('#superUserPassword,#confirmSuperUserPassword').on('keyup', function () {
                if ($('#superUserPassword').val() !== '' && $('#confirmSuperUserPassword').val() !== '') {
                    if ($('#superUserPassword').val() != $('#confirmSuperUserPassword').val()) {
                        $('#confirmSuperUserPassword').addClass('is-invalid');
                    } else {
                        $("#confirmSuperUserPassword").removeClass('is-invalid');
                    }
                }
            });
            //Submit super user form
            $('#createSuperUserForm').on('submit', async function (e) {
                e.preventDefault();
                const validForm = checkInvalid();
                if (validForm) {
                    $('#spinner').removeClass('d-none');
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
                            $('#spinner').addClass('d-none');
                            Swal.fire({
                                title: "Token Access Generado",
                                html: `Token:<b>${result.token_access}</b> <br>Guarde la llave en algun lugar seguro.`,
                                icon: "success"
                            }).then((res) => {
                                if (res.isConfirmed) {
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
                            $('#createSuperUserForm')[0].reset();
                        } else {
                            $('#spinner').addClass('d-none');
                            Swal.fire({
                                title: "Error",
                                text: `${result.message || response.statusText}`,
                                icon: "error"
                            });
                        }
                    } catch (error) {
                        console.error('Error:', error);
                    }
                }
            });
            break;
        case 'createUser':
            //Submit user form
            $('#createUserForm').on('submit', async function (e) {
                e.preventDefault();
                const validForm = checkInvalid();
                if (validForm) {
                    $('#spinner').removeClass('d-none');
                    const newUser = {
                        "token_access": document.getElementById('instTokenAccess').value,
                        "username": document.getElementById('newUsername').value,
                        "password": document.getElementById('newPassword').value,
                        "confirm_password": document.getElementById('confirmNewPassword').value,
                    };
                    try {
                        const response = await fetch('/.netlify/functions/auth/create-user', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(newUser)
                        });
                        const result = await response.json();
                        if (response.ok) {
                            $('#spinner').addClass('d-none');
                            Swal.fire({
                                title: "Éxito",
                                html: `Usuario Creado Correctamente`,
                                icon: "success"
                            });
                            $('#createUserForm').trigger("reset");
                        } else {
                            Swal.fire({
                                title: "Error",
                                text: `${result.message || response.statusText}`,
                                icon: "error"
                            });
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        Swal.fire({
                            title: "Error",
                            text: error,
                            icon: "error"
                        });
                    }
                }
            });

            //Validar contraseñas de usuarios iguales
            $('#newPassword,#confirmNewPassword').on('keyup', function () {
                if ($('#newPassword').val() !== '' && $('#confirmNewPassword').val() !== '') {
                    if ($('#newPassword').val() != $('#confirmNewPassword').val()) {
                        $('#confirmNewPassword').addClass('is-invalid');
                    } else {
                        $("#confirmNewPassword").removeClass('is-invalid');
                    }
                }
            });
            break;
        case 'renewalToken':
            const tokensUrl = "/.netlify/functions/catalog/tokens";
            cargarCatalogo(tokensUrl, 'tokens', ['date_created', 'updatedAt', 'username', 'token_access', 'remaining_days'], 'catalogoToken');
            //Submit renovar token de institucion
            $('#renewalTokenForm').on('submit', async function (e) {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const isA = document.getElementById('userType').value;

                if (username == '') $('#username').addClass('is-invalid');
                if (password == '') $('#password').addClass('is-invalid');

                const isValid = checkInvalid();
                if (isValid) {
                    $('#spinner').removeClass('d-none');

                    const authData = {
                        "username": username,
                        "password": password,
                        "isA": isA
                    };

                    try {
                        const response = await fetch('/.netlify/functions/auth/renewal', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(authData)
                        });

                        const result = await response.json();

                        if (response.ok) {
                            $('#spinner').addClass('d-none');
                            if (authData.isA == '1') {
                                Swal.fire({
                                    title: "Token Access Generado",
                                    html: `Token:<b>${result.token_access}</b> <br>Guarde la llave en algun lugar seguro.`,
                                    icon: "success"
                                }).then((res) => {
                                    if (res.isConfirmed) {
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
                                    title: "Éxito",
                                    html: `Se renovo correctamente el token de acceso de <strong>${username}</strong>.`,
                                    icon: "success"
                                });
                                $('#renewalTokenForm').trigger("reset");
                                cargarCatalogo(tokensUrl, 'tokens', ['date_created', 'updatedAt', 'username', 'token_access', 'remaining_days'], 'catalogoToken');
                            }
                        } else {
                            $('#spinner').addClass('d-none');
                            Swal.fire({
                                title: "Error",
                                text: `${result.message || response.statusText}`,
                                icon: "error"
                            });
                        }
                    } catch (error) {
                        $('#spinner').addClass('d-none');
                        console.error('Error:', error);
                    }
                }
            });
            break;
        case 'sendComplaints':
            //Submit Quejas
            $('#sendComplaintsForm').on('submit', async function (e) {
                e.preventDefault();
                const complaintData = {
                    QuejasDenominacion: $('#QuejasDenominacion').val() !== '' ? $('#QuejasDenominacion').val() : false,
                    QuejasSector: $('#QuejasSector').val() !== '' ? $('#QuejasSector').val() : false,
                    QuejasNoMes: $('#QuejasNoMes').val() !== '' ? $('#QuejasNoMes').val() : false,
                    QuejasNum: $('#QuejasNum').val() !== '' ? $('#QuejasNum').val() : false,
                    QuejasFolio: $('#QuejasFolio').val() !== '' ? $('#QuejasFolio').val() : false,
                    QuejasFecRecepcion: $('#QuejasFecRecepcion').val() !== '' ? $('#QuejasFecRecepcion').val() : false,
                    QuejasMedio: $('#QuejasMedio').val() !== '' ? $('#QuejasMedio').val() : false,
                    QuejasNivelAT: $('#QuejasNivelAT').val() !== '' ? $('#QuejasNivelAT').val() : false,
                    QuejasProducto: $('#QuejasProducto').val() !== '' ? $('#QuejasProducto').val() : false,
                    QuejasCausa: $('#QuejasCausa').val() !== '' ? $('#QuejasCausa').val() : false,
                    QuejasPORI: $('#QuejasPORI').val() !== '' ? $('#QuejasPORI').val() : false,
                    QuejasEstatus: $('#QuejasEstatus').val() !== '' ? $('#QuejasEstatus').val() : false,
                    QuejasEstados: $('#QuejasEstados').val() !== '' ? $('#QuejasEstados').val() : false,
                    QuejasCP: $('#QuejasCP').val() !== '' ? $('#QuejasCP').val() : false,
                    QuejasMunId: $('#QuejasMunId').val() !== '' ? $('#QuejasMunId').val() : false,
                    QuejasColId: $('#QuejasColId').val() !== '' ? $('#QuejasColId').val() : false,
                    QuejasLocId: $('#hiddenLocId').val() !== '' ? $('#hiddenLocId').val() : '',
                    QuejasTipoPersona: $('#QuejasTipoPersona').val() !== '' ? $('#QuejasTipoPersona').val() : false,
                    QuejasSexo: ($('#QuejasSexo').val() !== '') ? $('#QuejasSexo').val() : ($('#QuejasTipoPersona').val() === '1' ? false : ''),
                    QuejasEdad: $('#QuejasEdad').val() !== '' ? $('#QuejasEdad').val() : '',
                    QuejasFecResolucion: $('#QuejasFecResolucion').val(),
                    QuejasFecNotificacion: $('#QuejasFecNotificacion').val(),
                    QuejasRespuesta: $('#QuejasRespuesta').val() !== '' ? $('#QuejasRespuesta').val() : ($('#QuejasEstatus').val() === '2' ? false : ''),
                    QuejasNumPenal: $('#QuejasNumPenal').val().trim() !== '' ? $('#QuejasNumPenal').val() : '',
                    QuejasPenalizacion: $('#QuejasPenalizacion').val()
                };

                if (!validateForm(complaintData));
                if (!checkInvalid()) return;

                try {
                    const response = await fetch('/.netlify/functions/complaint/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(complaintData)
                    });

                    const result = await response.json();
                    if (response.ok) {
                        $('#spinner').addClass('d-none');
                        Swal.fire({
                            title: "Éxito",
                            html: `Se envio correctamente la queja.`,
                            icon: "success"
                        });
                        $('#sendComplaintsForm').trigger("reset");
                    } else {
                        $('#spinner').addClass('d-none');
                        Swal.fire({
                            title: "Error",
                            text: `${result.message || response.statusText}`,
                            icon: "error"
                        });
                    }
                } catch (error) {
                    $('#spinner').addClass('d-none');
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

            $('#QuejasTipoPersona').on('change', function () {
                if ($(this).val() == '2') {
                    $('#QuejasSexo').attr('disabled', true);
                    $('#QuejasSexo').val('');
                    $('#QuejasEdad').attr('disabled', true);
                    $('#QuejasEdad').val('');
                } else {
                    $('#QuejasSexo').attr('disabled', false);
                    $('#QuejasEdad').attr('disabled', false);
                }
            });

            $('#QuejasEstatus').on('change', function () {
                if ($(this).val() == '1') {
                    $('#QuejasRespuesta').attr('disabled', true);
                    $('#QuejasRespuesta').val('');
                } else {
                    $('#QuejasRespuesta').attr('disabled', false);
                }
            });
            break;
        case 'findComplaints':
            const dateNow = new Date();
            const currentYear = dateNow.getFullYear();
            let arrYears = [];
            for (let i = currentYear - 5; i <= currentYear + 5; i++) {
                arrYears.push(i.toString());
            }
            const selectElement = document.getElementById('año');

            arrYears.forEach(item => {
                const option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                selectElement.appendChild(option);
            });

            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var year = $('#año').val();
                var month = $('#mes').val();
                if (year !== '' && month !== '') {
                    buscarQueja(year, month);
                    $('.container-table100').show();
                } else if (month === '') {
                    $('#mes').focus();
                    $('#mes').addClass('is-invalid');
                } else {
                    $('#año').focus();
                    $('#año').addClass('is-invalid');
                }
            });

            $('#año,#mes').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'delComplaints':
            $('#delComplaintsForm').on('submit', function (e) {
                e.preventDefault();
                var folio = $('#quejaId').val().trim();
                if (folio !== '') {
                    Swal.fire({
                        title: "Advertencia",
                        html: `¿Está seguro de eliminar la queja <strong>${folio}</strong>?`,
                        icon: "warning",
                        confirmButtonColor: "#007f4f",
                        confirmButtonText: "Si",
                        showDenyButton: true,
                        denyButtonText: 'No',
                    }).then(async (res) => {
                        if (res.isConfirmed) {
                            try {
                                const response = await fetch('/.netlify/functions/complaint/del', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ folio: folio })
                                });
            
                                const result = await response.json();
            
                                if (response.ok) {
                                    $('#spinner').addClass('d-none');
                                    Swal.fire({
                                        title: "Éxito",
                                        html: `Has eliminado correctamente la queja <strong>${folio}</strong>`,
                                        icon: "success",
                                        timer: 4000,
                                        showConfirmButton: false
                                    });
                                    $('#delComplaintsForm')[0].reset();
                                } else {
                                    Swal.fire({
                                        title: "Error",
                                        text: `${result.message || response.statusText}`,
                                        icon: "error"
                                    });
                                }
                            } catch (error) {
                                Swal.fire({
                                    title: "Error",
                                    text: `Error al eliminar la queja: ${error.message}`,
                                    icon: "error"
                                });
                                console.error('Error:', error);
                            }
                        }
                    });
                } else {
                    $('#quejaId').focus();
                    $('#quejaId').addClass('is-invalid');
                }
            });
            break;
        case 'catalogos/mediosRecepcion':
            const mrAPI = "https://api.condusef.gob.mx/catalogos/medio-recepcion";
            cargarCatalogo(mrAPI, 'medio', ['medioId', 'medioDsc'], 'catalogoMR');
            break;
        case 'catalogos/nivelesAtencion':
            const naAPI = "https://api.condusef.gob.mx/catalogos/niveles-atencion";
            cargarCatalogo(naAPI, 'nivelesDeAtencion', ['nivelDeAtencionId', 'nivelDeAtencionDsc'], 'catalogoNA');
            break;
        case 'catalogos/productos':
            cargarProductos();
            break;
        case 'catalogos/causas':
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvProd = $('#clvProd').val();
                if (clvProd !== '') {
                    cargarCausas(clvProd);
                    $('.container-table100').show();
                } else {
                    $('#clvProd').focus();
                    $('#clvProd').addClass('is-invalid');
                }
            });
            $('#clvProd').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'SEPOMEX/estados':
            const estAPI = "https://api.condusef.gob.mx/sepomex/estados/";
            cargarCatalogo(estAPI, 'estados', ['claveEdo', 'estado'], 'catalogoEstados');
            break;
        case 'SEPOMEX/codigosPostales':
            $('.container-table100').hide();
            const edoSelect = document.getElementById("clvEdo");
            const edoAPI = "https://api.condusef.gob.mx/sepomex/estados/";
            cargarCatalogoSelect(edoAPI, edoSelect, 'estados', 'claveEdo', 'estado');
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvEdo = $('#clvEdo').val();
                if (clvEdo !== '') {
                    const cpAPI = "https://api.condusef.gob.mx/sepomex/codigos-postales/?estado_id=" + clvEdo;
                    cargarCatalogo(cpAPI, 'codigos_postales', ['estadoId', 'estado', 'codigo_sepomex'], 'catalogoCP');
                    $('.container-table100').show();
                } else {
                    $('#clvEdo').focus();
                    $('#clvEdo').addClass('is-invalid');
                }
            });
            $('#clvEdo').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'SEPOMEX/municipios':
            $('.container-table100').hide();
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvCP = $('#clvCP').val().trim();;
                var clvEdo = $('#clvEdo').val().trim();;
                if (clvCP !== '' && clvEdo !== '') {
                    const munAPI = "https://api.condusef.gob.mx/sepomex/municipios/?estado_id=" + clvEdo + "&cp=" + clvCP;
                    cargarCatalogo(munAPI, 'municipios', ['estadoId', 'municipioId', 'municipio'], 'catalogoMunicipios');
                    $('.container-table100').show();
                } else if (clvCP === '') {
                    $('#clvCP').focus();
                    $('#clvCP').addClass('is-invalid');
                } else {
                    $('#clvEdo').focus();
                    $('#clvEdo').addClass('is-invalid');
                }
            });
            $('#clvCP').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'SEPOMEX/colonias':
            $('.container-table100').hide();
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                var clvCP = $('#clvCP').val().trim();
                if (clvCP !== '') {
                    const colAPI = "https://api.condusef.gob.mx/sepomex/colonias/?cp=" + clvCP;
                    cargarCatalogo(colAPI, 'colonias', ['estadoId', 'estado', 'municipioId', 'municipio', 'coloniaId', 'colonia', 'tipoLocalidadId', 'tipoLocalidad'], 'catalogoColonias');
                    $('.container-table100').show();
                } else {
                    $('#clvCP').focus();
                    $('#clvCP').addClass('is-invalid');
                }
            });
            $('#clvCP').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'contacto':
            $('#contactoForm').on('submit', function (e) {
                e.preventDefault();

                // Validación de los campos
                let valid = true;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                // Obtener los valores de los campos
                const nombre = $('#nameContacto').val();
                const email = $('#emailContacto').val();
                const asunto = $('#asuntoContacto').val();
                const mensaje = $('#mensajeContacto').val();

                // Limpiar mensajes de error
                $('input, textarea, select').removeClass('is-invalid');

                // Validar que los campos no estén vacíos
                if (nombre === '') {
                    valid = false;
                    $('#nameContacto').addClass('is-invalid');
                }

                if (email === '' || !emailRegex.test(email)) {
                    valid = false;
                    $('#emailContacto').addClass('is-invalid');
                }

                if (asunto === '') {
                    valid = false;
                    $('#asuntoContacto').addClass('is-invalid');
                }

                if (mensaje === '') {
                    valid = false;
                    $('#mensajeContacto').addClass('is-invalid');
                }

                // Si la validación es exitosa
                if (valid) {
                    // Enviar los datos del formulario
                    const nombre = $('#nameContacto').val();
                    const email = $('#emailContacto').val();
                    const asunto = $('#asuntoContacto').val();
                    const mensaje = $('#mensajeContacto').val();

                    const templateParams = {
                        from_name: nombre,
                        from_email: email,
                        asunto: asunto,
                        mensaje: mensaje
                    };

                    emailjs.send('ser_v.gx632*#rdc', 'temp_b9emfep*.#rdc', templateParams)
                        .then(function (response) {
                            if (response.ok) {
                                Swal.fire({ title: 'Éxito', text: '¡Gracias! Tu mensaje ha sido enviado.', icon: 'success' });
                            } else {
                                Swal.fire({ title: 'Error', text: 'Hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.', icon: 'error' });
                            }
                            $('#contactoForm')[0].reset();
                        }, function (error) {
                            Swal.fire({ title: 'Error', text: 'Hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.', icon: 'error' });
                        });
                } else {
                    Swal.fire({ title: 'Error', text: 'Por favor, corrige los campos marcados antes de enviar.', icon: 'error' });
                }
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
                selectElement.innerHTML = '<option value="">Seleccione una opción</option>';
                if (setLocalidad) {
                    selectElement.innerHTML = '';
                }
                data[key].forEach(item => {
                    if (setLocalidad && item['coloniaId'] == colonia && item['municipioId'] == municipio) {
                        document.getElementById('hiddenLocId').value = item[idField];
                        selectElement.value = item[textField];
                    } else {
                        const option = document.createElement("option");
                        option.value = item[idField];
                        option.textContent = item[textField];
                        selectElement.appendChild(option);
                    }
                });
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

function cargarCatalogo(url, key, columns, table) {
    $('#spinner').removeClass('d-none');
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const dataRet = data[key].map(item => columns.map(col => item[col]))
            setTable(dataRet, table);
        })
        .catch(error => console.error('Error al cargar el catálogo:', error));
}

function cargarCatalogoWD(data, key, columns, table) {
    const dataRet = data[key].map(item => columns.map(col => item[col]));
    setTable(dataRet, table);
}

async function cargarProductos() {
    const prodCache = sessionStorage.getItem('product-list');
    if (prodCache) {
        const data = JSON.parse(prodCache);
        cargarCatalogoWD(data, 'productos', ["productoId", "productoDes"], 'catalogoProd');
    } else {
        try {
            const response = await fetch('/.netlify/functions/catalog/product', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud:${response.statusText})`);
            }

            const data = await response.json();
            sessionStorage.setItem('product-list', JSON.stringify(data));
            cargarCatalogoWD(data, 'productos', ["productoId", "productoDes"], 'catalogoProd');
        } catch (error) {
            console.error('Error al cargar los productos:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al cargar el catálogo de productos.',
                icon: 'error'
            }).then((result) => {
                if (result.isConfirmed) window.location.href = 'index.html';
            });
        }
    }
}

async function cargarCausas(prodId) {
    const causasCache = sessionStorage.getItem('causas-list');
    if (causasCache) {
        const data = JSON.parse(causasCache);
        cargarCatalogoWD(data, 'causas', ["causaId", "causaDes"], 'catalogoCausas');
    } else {
        try {
            const response = await fetch('/.netlify/functions/catalog/causas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prodId: prodId })
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud:${response.statusText})`);
            }

            const data = await response.json();
            sessionStorage.setItem('causas-list', JSON.stringify(data));
            cargarCatalogoWD(data, 'causas', ["causaId", "causaDes"], 'catalogoCausas');
        } catch (error) {
            console.error('Error al cargar las causas:', error);
            Swal.fire({
                title: 'Error',
                text: 'Hubo un error al cargar el catálogo de causas.',
                icon: 'error'
            }).then((result) => {
                if (result.isConfirmed) window.location.href = 'index.html';
            });
        }
    }
}

async function buscarQueja(year, month) {
    try {
        const response = await fetch('/.netlify/functions/complaint/find', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ year: year, month: month })
        });

        if (!response.ok) {
            throw new Error(`Error en la solicitud:${response.statusText})`);
        }

        const data = await response.json();
        cargarCatalogoWD(data, 'queja', ["quejaId", "quejaDes"], 'catalogoQuejas');
    } catch (error) {
        console.error('Error al cargar la queja:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un error al cargar la queja.',
            icon: 'error'
        }).then((result) => {
            if (result.isConfirmed) window.location.href = 'index.html';
        });
    }
}

function setTable(data, table) {
    if ($.fn.DataTable.isDataTable(`#${table}`)) {
        $(`#${table}`).DataTable().clear().rows.add(data).draw();
    } else {
        $(`#${table}`).DataTable({
            data: data,
            "language": {
                "lengthMenu": "Mostrar _MENU_ registros por página",
                "zeroRecords": "No se encontraron registros",
                "info": "Mostrando página _PAGE_ de _PAGES_",
                "infoEmpty": "No hay registros disponibles",
                "infoFiltered": "(filtrado de _MAX_ registros totales)",
                "search": "Buscar:",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                }
            }
        });
    }
    $('#spinner').addClass('d-none');
}