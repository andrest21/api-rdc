function checkInvalid(form) {
    const invalidFields = $(`#${form} .is-invalid`);
    if (invalidFields.length > 0) {
        Swal.fire({
            text: "Por favor, corrija los campos inválidos antes de enviar.",
            icon: "warning"
        });
        invalidFields.first().focus();
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
            document.getElementById('seccionDinamica').innerHTML = htmlContent;

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            let descSecciones = ['createSuperUser', 'createUser', 'renewalToken', 'contacto','general'];
            let selectedLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
            if (descSecciones.includes(sectionId) && selectedLink) {
                selectedLink.classList.add('active');
            } else if (selectedLink) {
                selectedLink.parentElement.parentElement.previousElementSibling.classList.add('active');
            }
            initSectionLogic(sectionId);
        })
        .catch(error => {
            console.error('Error al cargar la sección:', error);
            document.getElementById('seccionDinamica').innerHTML = '<p>Error al cargar la sección, por favor contactar a soporte.</p>';
        });
}

function showSection(sectionId, isfirst = false) {
    if (!isfirst) {
        checkAuth(false).then(() => {
            loadSection(sectionId);
        }).catch((errorCode) => {
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
    $('input:not(.maskedInput)').on('keyup', function () {
        $(this).removeClass('is-invalid');
    });
    $('select:not(.maskedInput)').on('change', function () {
        $(this).removeClass('is-invalid');
    });
    
    $('input.numerico').inputmask({ mask: "9", repeat: '4' });
    
    $('input.edadInputMask').inputmask('numeric', { min: '0', max: '150', clearMaskOnLostFocus: true });
    
    $('input.cp').inputmask({ mask: "9", repeat: '5' });
    
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
        case 'general':
            let uInsId = "";
            let uInsD = "";
            let uInsS = "";
            
            if (sessionStorage.getItem('uA')) {
                const uAstring = sessionStorage.getItem('uA');
                try {
                    const uA = JSON.parse(uAstring);
                    uInsId = uA.institution || "";
                    uInsD = uA.desc_institution || "";
                    uInsS = uA.sector_institution || "";
                } catch (error) {
                    console.error('Error al parsear JSON:', error);
                    return loadContent('views/login.html');
                }
            } else {
                return loadContent('views/login.html');
            }

            const idInput = document.getElementById('id_institucion');
            const descInput = document.getElementById('razon_institucion');
            const sectorInput = document.getElementById('sector_institucion');
        
            if (idInput && descInput && sectorInput) {
                idInput.value = uInsId;
                descInput.value = uInsD;
                sectorInput.value = uInsS;
            }
            $('#editar').on('click', function (e) {
                e.preventDefault();
                Swal.fire({
                    title: "Advertencia",
                    html: `¿Está seguro de editar la información de la Institución?`,
                    icon: "warning",
                    confirmButtonColor: "#007f4f",
                    confirmButtonText: "Si",
                    titleColor: "#fff",
                    showDenyButton: true,
                    denyButtonText: 'No',
                }).then((res) => {
                    if (res.isConfirmed) {
                        $('#razon_institucion').prop('readonly',false);
                        $('#sector_institucion').prop('readonly',false);
                        $('#editarConfirm').prop('hidden',false);
                        $('#editarCancel').prop('hidden',false);
                        $('#editar').prop('hidden',true);
                    }else{
                        $('#razon_institucion').prop('readonly',true);
                        $('#sector_institucion').prop('readonly',true);
                        $('#editarConfirm').prop('hidden',true);
                        $('#editarCancel').prop('hidden',true);
                        $('#editar').prop('hidden',false);
                    }
                });
            });
            $('#editarCancel').on('click', function (e) {
                $('#razon_institucion').prop('readonly',true);
                $('#sector_institucion').prop('readonly',true);
                $('#editarConfirm').prop('hidden',true);
                $('#editarCancel').prop('hidden',true);
                $('#editar').prop('hidden',false);
            });
            $('#editarConfirm').on('click', async function (e) {
                e.preventDefault();
                const payload = {
                    id_institution: $('#id_institucion').val().trim(),
                    institution_desc: $('#razon_institucion').val().trim(),
                    institution_sector: $('#sector_institucion').val().trim(),
                };
            
                if (!payload.id_institution || !payload.institution_desc || !payload.institution_sector) {
                    Swal.fire({
                        title: "Error",
                        text: "Por favor, complete todos los campos requeridos antes de continuar.",
                        icon: "error",
                    });
                    return;
                }
            
                Swal.fire({
                    title: "Advertencia",
                    html: `Al guardar los datos de su Institución cambiarán. ¿Está seguro de continuar?`,
                    icon: "warning",
                    confirmButtonColor: "#007f4f",
                    confirmButtonText: "Sí",
                    titleColor: "#fff",
                    showDenyButton: true,
                    denyButtonText: "No",
                }).then(async (res) => {
                    if (res.isConfirmed) {
                        $('#spinner').removeClass('d-none');
                        try {
                            const response = await fetch('/.netlify/functions/catalog/institutions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload),
                            });
            
                            const result = await response.json();
                            if (response.ok) {
                                Swal.fire({
                                    title: "Éxito",
                                    html: `${result.message}`,
                                    icon: "success",
                                });
                                const uAstring = sessionStorage.getItem('uA');
                                const uA = JSON.parse(uAstring);
                                uA['desc_institution'] = result.desc_institution;
                                uA['sector_institution'] = result.sector_institution;
                                sessionStorage.setItem('uA', JSON.stringify(uA));
                                showSection('general', false);
                            } else {
                                Swal.fire({
                                    title: "Error",
                                    text: result.message || response.statusText,
                                    icon: "error",
                                });
                            }
                        } catch (error) {
                            console.error('Error en la solicitud:', error);
                            Swal.fire({
                                title: "Error",
                                text: error,
                                icon: "error"
                            });
                        } finally {
                            $('#spinner').addClass('d-none');
                        }
                    } else {
                        $('#razon_institucion').prop('readonly', true);
                        $('#sector_institucion').prop('readonly', true);
                        $('#editarConfirm').prop('hidden', true);
                        $('#editar').prop('hidden', false);
                    }
                });
            });
        case 'createSuperUser':
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

            $('#superUserPassword,#confirmSuperUserPassword').on('keyup', function () {
                if ($('#superUserPassword').val() !== '' && $('#confirmSuperUserPassword').val() !== '') {
                    if ($('#superUserPassword').val() != $('#confirmSuperUserPassword').val()) {
                        $('#confirmSuperUserPassword').addClass('is-invalid');
                    } else {
                        $("#confirmSuperUserPassword").removeClass('is-invalid');
                    }
                }
            });
            
            $('#createSuperUserForm').on('submit', async function (e) {
                e.preventDefault();
                const validForm = checkInvalid("createSuperUserForm");
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
                        $('#spinner').addClass('d-none');
                        console.error('Error:', error);
                        Swal.fire({
                            title: "Error",
                            text: error,
                            icon: "error"
                        });
                    }
                }
            });
            break;
        case 'createUser':
            $('#createUserForm').on('submit', async function (e) {
                e.preventDefault();
                const validForm = checkInvalid("createUserForm");
                if (validForm) {
                    $('#spinner').removeClass('d-none');
                    const newUser = {
                        "su_ta": document.getElementById('instTokenAccess').value,
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
                                html: `El usuario ha sido creado exitosamente!`,
                                icon: "success"
                            });
                            $('#createUserForm').trigger("reset");
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
                        Swal.fire({
                            title: "Error",
                            text: error,
                            icon: "error"
                        });
                    }
                }
            });

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
            
            $('#renewalTokenForm').on('submit', async function (e) {
                e.preventDefault();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const isA = document.getElementById('userType').value;

                if (username == '') $('#username').addClass('is-invalid');
                if (password == '') $('#password').addClass('is-invalid');

                const isValid = checkInvalid("renewalTokenForm");
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
        case 'sendComplaints':;
            let uInsDG = "";
            let uInsSG= "";
            
            if (sessionStorage.getItem('uA')) {
                const uAstringG = sessionStorage.getItem('uA');
                try {
                    const uAG = JSON.parse(uAstringG);
                    uInsDG = uAG.desc_institution || "";
                    uInsSG = uAG.sector_institution || "";
                } catch (error) {
                    console.error('Error al parsear JSON:', error);
                    return loadContent('views/login.html');
                }
            } else {
                return loadContent('views/login.html');
            }

            const descInputG = document.getElementById('QuejasDenominacion');
            const sectorInputG = document.getElementById('QuejasSector');
        
            if (descInputG && sectorInputG) {
                descInputG.value = uInsDG;
                descInputG.setAttribute('readonly',true);
                sectorInputG.value = uInsSG;
                sectorInputG.setAttribute('readonly',true);
            }
            
            $('#sendComplaintsForm').on('submit', async function (e) {
                e.preventDefault();

                const numericFields = [
                    'QuejasNoMes', 'QuejasNum', 'QuejasMedio', 'QuejasNivelAT',
                    'QuejasEstatus', 'QuejasEstados', 'QuejasMunId',
                    'QuejasLocId', 'QuejasColId', 'QuejasCP',
                    'QuejasTipoPersona', 'QuejasRespuesta'
                ];

                const complaintData = {
                    QuejasDenominacion: $('#QuejasDenominacion').val() || false,
                    QuejasSector: $('#QuejasSector').val() || false,
                    QuejasNoMes: parseInt($('#QuejasNoMes').val()) || false,
                    QuejasNum: parseInt($('#QuejasNum').val()) || false,
                    QuejasFolio: $('#QuejasFolio').val().trim() || false,
                    QuejasFecRecepcion: convertDate($('#QuejasFecRecepcion').val()) || false,
                    QuejasMedio: parseInt($('#QuejasMedio').val()) || false,
                    QuejasNivelAT: parseInt($('#QuejasNivelAT').val()) || false,
                    QuejasProducto: $('#QuejasProducto').val().trim() || false,
                    QuejasCausa: $('#QuejasCausa').val().trim() || false,
                    QuejasPORI: $('#QuejasPORI').val() || false,
                    QuejasEstatus: parseInt($('#QuejasEstatus').val()) || false,
                    QuejasEstados: parseInt($('#QuejasEstados').val()) || false,
                    QuejasCP: parseInt($('#QuejasCP').val()) || false,
                    QuejasMunId: parseInt($('#QuejasMunId').val()) || false,
                    QuejasColId: parseInt($('#QuejasColId').val()) || false,
                    QuejasLocId: parseInt($('#hiddenLocId').val()) || '',
                    QuejasTipoPersona: parseInt($('#QuejasTipoPersona').val()) || false,
                    QuejasSexo: ($('#QuejasSexo').val() || ($('#QuejasTipoPersona').val() === '1' ? false : '')),
                    QuejasEdad: parseInt($('#QuejasEdad').val()) || '',
                    QuejasFecResolucion: convertDate($('#QuejasFecResolucion').val()),
                    QuejasFecNotificacion: convertDate($('#QuejasFecNotificacion').val()),
                    QuejasRespuesta: parseInt($('#QuejasRespuesta').val()) || ($('#QuejasEstatus').val() === '2' ? false : ''),
                    QuejasNumPenal: $('#QuejasNumPenal').val().trim() || null,
                    QuejasPenalizacion: $('#QuejasPenalizacion').val() || null,
                };
                
                for (const field of numericFields) {
                    if (complaintData[field] !== false && isNaN(complaintData[field])) {
                        Swal.fire({
                            title: "Error",
                            text: `El campo ${field} debe ser numérico.`,
                            icon: "error"
                        });
                        return;
                    }
                }

                if (!validateForm(complaintData));
                if (!checkInvalid("sendComplaintsForm")) return;

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
                            html: `Se envio correctamente la queja!`,
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

            const medioRecepcionAPI = "https://api-redeco.condusef.gob.mx/catalogos/medio-recepcion";
            const nivelAtencionAPI = "https://api-redeco.condusef.gob.mx/catalogos/niveles-atencion";
            const estadosAPI = "https://api-redeco.condusef.gob.mx/sepomex/estados/";

            const medioSelect = document.getElementById("QuejasMedio");
            const nivelATSelect = document.getElementById("QuejasNivelAT");
            const estadosSelect = document.getElementById("QuejasEstados");

            cargarCatalogoSelect(medioRecepcionAPI, medioSelect, 'medio', 'medioId', 'medioDsc');
            cargarCatalogoSelect(nivelAtencionAPI, nivelATSelect, 'nivelesDeAtencion', 'nivelDeAtencionId', 'nivelDeAtencionDsc');
            cargarCatalogoSelect(estadosAPI, estadosSelect, 'estados', 'claveEdo', 'estado');

            $('#QuejasEstados').on('change', function () {
                $('#QuejasCP').attr('disabled', false);
                $('#QuejasMunId').attr('disabled', true);
                $('#QuejasColId').attr('disabled', true);
                $('#QuejasLocId').attr('disabled', true);
                $('#QuejasLocId').val('');
                $('#hiddenLocId').val('');
                $('#QuejasCP').val('');
            });

            $('#QuejasCP').on('change', function () {
                $('#QuejasMunId').attr('disabled', true);
                $('#QuejasColId').attr('disabled', true);
                $('#QuejasLocId').attr('disabled', true);
                $('#QuejasLocId').val('');
                $('#hiddenLocId').val('');
                if ($('#QuejasEstados').val() !== '') {
                    const municipiosAPI = "https://api-redeco.condusef.gob.mx/sepomex/municipios/?estado_id=" + $('#QuejasEstados').val() + "&cp=" + $('#QuejasCP').val();
                    const municipiosSelect = document.getElementById("QuejasMunId");
                    cargarCatalogoSelect(municipiosAPI, municipiosSelect, 'municipios', 'municipioId', 'municipio', 'QuejasMunId');
                    const coloniasAPI = "https://api-redeco.condusef.gob.mx/sepomex/colonias/?cp=" + $('#QuejasCP').val();
                    const coloniasSelect = document.getElementById("QuejasColId");
                    cargarCatalogoSelect(coloniasAPI, coloniasSelect, 'colonias', 'coloniaId', 'colonia', 'QuejasColId');
                }
            });

            $('#QuejasColId,#QuejasMunId').on('change', function () {
                $('#QuejasLocId').attr('disabled', true);
                $('#QuejasLocId').val('');
                $('#hiddenLocId').val('');
                if ($('#QuejasColId').val() !== '' && $('#QuejasMunId').val() !== '') {
                    const coloniaId = $('#QuejasColId').val();
                    const municipioId = $('#QuejasMunId').val();
                    const coloniasAPI = "https://api-redeco.condusef.gob.mx/sepomex/colonias/?cp=" + $('#QuejasCP').val();
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
                let year = $('#año').val();
                let month = $('#mes').val();
                if (year !== '' && month !== '') {
                    $('#spinner').removeClass('d-none');
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
                $('#año,#mes').removeClass('is-invalid');
                $('.container-table100').hide();
            });
            break;
        case 'delComplaints':
            $('#delComplaintsForm').on('submit', function (e) {
                e.preventDefault();
                let folio = $('#quejaId').val().trim();
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
            const mrAPI = "https://api-redeco.condusef.gob.mx/catalogos/medio-recepcion";
            cargarCatalogo(mrAPI, 'medio', ['medioId', 'medioDsc'], 'catalogoMR');
            break;
        case 'catalogos/nivelesAtencion':
            const naAPI = "https://api-redeco.condusef.gob.mx/catalogos/niveles-atencion";
            cargarCatalogo(naAPI, 'nivelesDeAtencion', ['nivelDeAtencionId', 'nivelDeAtencionDsc'], 'catalogoNA');
            break;
        case 'catalogos/productos':
            $('#spinner').removeClass('d-none');
            cargarProductos();
            break;
        case 'catalogos/causas':
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                let clvProd = $('#clvProd').val();
                if (clvProd !== '') {
                    $('#spinner').removeClass('d-none');
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
            const estAPI = "https://api-redeco.condusef.gob.mx/sepomex/estados/";
            cargarCatalogo(estAPI, 'estados', ['claveEdo', 'estado'], 'catalogoEstados');
            break;
        case 'SEPOMEX/codigosPostales':
            $('.container-table100').hide();
            const edoSelect = document.getElementById("clvEdo");
            const edoAPI = "https://api-redeco.condusef.gob.mx/sepomex/estados/";
            cargarCatalogoSelect(edoAPI, edoSelect, 'estados', 'claveEdo', 'estado');
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                let clvEdo = $('#clvEdo').val();
                checkInvalid("codigosPostales");
                if (clvEdo !== '') {
                    const cpAPI = "https://api-redeco.condusef.gob.mx/sepomex/codigos-postales/?estado_id=" + clvEdo;
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
            const edSelect = document.getElementById("clvEdo");
            const edAPI = "https://api-redeco.condusef.gob.mx/sepomex/estados/";
            cargarCatalogoSelect(edAPI, edSelect, 'estados', 'claveEdo', 'estado');
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                let clvCP = $('#clvCP').val().trim();;
                let clvEdo = $('#clvEdo').val().trim();;
                checkInvalid("municipios");
                if (clvCP !== '' && clvEdo !== '') {
                    const munAPI = "https://api-redeco.condusef.gob.mx/sepomex/municipios/?estado_id=" + clvEdo + "&cp=" + clvCP;
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
            $('#clvCP,#clvEdo').on('change', function () {
                $('.container-table100').hide();
            });
            break;
        case 'SEPOMEX/colonias':
            $('.container-table100').hide();
            $('#btnBuscar').on('click', function (e) {
                e.preventDefault();
                let clvCP = $('#clvCP').val().trim();
                checkInvalid("colonias");
                if (clvCP !== '') {
                    const colAPI = "https://api-redeco.condusef.gob.mx/sepomex/colonias/?cp=" + clvCP;
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
                checkInvalid("contactoForm");
                let valid = true;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                const nombre = $('#nameContacto').val().trim();
                const email = $('#emailContacto').val().trim();
                const asunto = $('#asuntoContacto').val().trim();
                const mensaje = $('#mensajeContacto').val().trim();

                $('input, textarea, select').removeClass('is-invalid');

                if (nombre === '' || nombre === null) {
                    valid = false;
                    $('#nameContacto').addClass('is-invalid');
                }

                if (email === '' || !emailRegex.test(email)) {
                    valid = false;
                    $('#emailContacto').addClass('is-invalid');
                }

                if (asunto === '' || asunto === null) {
                    valid = false;
                    $('#asuntoContacto').addClass('is-invalid');
                }

                if (mensaje === '' || mensaje === null) {
                    valid = false;
                    $('#mensajeContacto').addClass('is-invalid');
                }

                if (valid) {
                    $('#spinner').removeClass('d-none');
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
                            $('#spinner').addClass('d-none');
                            if (response.status === 200) {
                                Swal.fire({ title: 'Éxito', text: '¡Gracias! Tu mensaje ha sido enviado, en breve nos comunicaremos contigo.', icon: 'success' });
                            } else {
                                Swal.fire({ title: 'Error', text: 'Hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.', icon: 'error' });
                            }
                            $('#contactoForm')[0].reset();
                        }, function (error) {
                            $('#spinner').addClass('d-none');
                            console.error('Error:', error);
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

function cargarCatalogoSelect(url, selectElement, key, idField, textField, disabledField = "", setLocalidad = false, colonia = "", municipio = "") {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data[key] != '' && !data.error) {
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
            if(!data.error){
                const dataRet = data[key].map(item => columns.map(col => item[col]))
                setTable(dataRet, table);
            }else{
                console.error('Error al cargar el catálogo:', data.error);
                setTable('',table);
            }
            
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
        cargarCatalogoWD(data, 'products', ["productId", "product", "institucion"], 'catalogoProd');
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
            cargarCatalogoWD(data, 'products', ["productId", "product", "institucion"], 'catalogoProd');
        } catch (error) {
            $('#spinner').addClass('d-none');
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
    const productId = sessionStorage.getItem('product-id');
    if (causasCache && (productId === prodId)) {
        const data = JSON.parse(causasCache);
        cargarCatalogoWD(data, 'causas', ["causaId", "causa", "institucion"], 'catalogoCausas');
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
            if (response.ok){
                if (data['causas'].length != 0 )
                    sessionStorage.setItem('causas-list', JSON.stringify(data));
                else
                    sessionStorage.removeItem('causas-list');
                sessionStorage.setItem('product-id', prodId);
                cargarCatalogoWD(data, 'causas', ["causaId", "causa", "institucion"], 'catalogoCausas');
            } else {
                $('#spinner').addClass('d-none');
                Swal.fire({
                    title: "Error",
                    text: `${data.error || response.statusText}`,
                    icon: "error"
                });
            }
        } catch (error) {
            $('#spinner').addClass('d-none');
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
        cargarCatalogoWD(data, 'quejas', ["institucionClave", "folio", "year","month"], 'catalogoQuejas');
    } catch (error) {
        $('#spinner').addClass('d-none');
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

function convertDate(fecha){
    return fecha.split("-").reverse().join("/");
}