// Bostable
// Jquery DataTable that implements REST operations
// Author: Bruno da Silva João
// https://github.com/vinagreti/bostable.git

// Define as JQuery Plugin
jQuery(function( $ ){

    var bostables = {}; // Tables in the DOM
    
    var base_url = base_url ? base_url : window.location.hostname;

    $.fn.extend({

        bostable: function(options) {

            // PLUGIN CONFIGURATION
            // ================================
            var defaults = {
                page: url_parameter('page') ? url_parameter('page') : 1
                , limit: url_parameter('limit') ? url_parameter('limit') : 50
                , currency_uri: base_url + "currency"
                , load_currency_on_startup: false
            };

            // ESURE APPEND AJAX DATA
            // ================================
            if(options){
                options.appendAjaxData = options.appendAjaxData ? options.appendAjaxData : {};
            } else {
                options = {appendAjaxData:{}};
            }

            // DYNAMIC CONFIGURATION
            // ================================
            var config = $.extend(defaults, options);

            // TABLE ID
            // ================================
            var id_tabela = $(this).attr('id');

            // IF THE TABLE IS NOT INSTATIED, INSTANTIATE IT
            // ================================
            if(!bostables[id_tabela]){

                return bostables[id_tabela] = new bostableClass( $(this), config ); // aplica a classe bostable na tabela

            } else {

                return bostables[id_tabela];

            }

            // BOSTABLE CLASS
            // ================================
            function bostableClass( tabela, config ) {

                // PRIVATE VARIABLES
                // ================================
                var self = this; // instancia a si mesmo para poder ser referenciado dentro de funções
                var total_banco = 0; // total de itens encontrados no banco
                var rawData; // ítens da tabela
                var currency = false;
                var remoteUrl = ''; // REST API URL - RESOURCE TO BE HANDLED
                var appendAjaxData = {};

                if(config.load_currency_on_startup && !currency)
                    getCurrencyFromServer();

                function getCurrencyFromServer() {
                    $.get(config.currency_uri)
                    .done(function (res) {
                        currency = res;
                    });
                };

                // REST API URL - RESOURCE TO BE HANDLED
                // ================================
                remoteUrl = config['data-resource-uri'] ? config['data-resource-uri'].replace(/\/\s*$/, "") : tabela.attr("data-resource-uri").replace(/\/\s*$/, ""); // uri base da tabela (insere / no fim da string)
                remoteUrl = (remoteUrl.indexOf('?') > -1) ? remoteUrl + '&' : remoteUrl + '?';

                // aplica a classe de ordenação na tabela
                // $(function(){ tabela.tablesorter(); });

                // ADD SELECT CHECKBOX TO THE TABLE
                // ======================
                tabela.find('.bostable_select_all').html('<input type="checkbox" class="bostable_select_all_checkbox">');
                tabela.find('.bostable_select_row').html('<input type="checkbox" class="bostable_select_row_checkbox">');

                // MAPS THE TABLE STRUCTURE
                // ======================
                var elementoLinha = tabela.find("tbody").find("tr").clone(); // copia a estrutura HTML da linha

                tabela.find("tbody").find("tr").remove(); // remove a linha modelo

                var elementoCaption = (tabela.find(".bostable_head").length > 0) ? tabela.find(".bostable_head").clone() : $('<div class="bostable_head"></div>'); // copia a estrutura HTML do caption

                tabela.find("caption").remove(); // remove o caption

                var elementoTfooter = (tabela.find("tfoot").length > 0) ? tabela.find("tfoot").clone() : $('<tfoot>'); // copia a estrutura HTML do tfoot

                tabela.find("tfoot").remove(); // remove o tfoot

                $.each( tabela.find("th"), function( index, th ){ // configura o cabeçalho da tabela

                    if (typeof $(th).attr("ordenavel") !== 'undefined' && $(th).attr("ordenavel") !== false) { // se tiverem o atributo "ordenavel"

                        $(th).css("cursor", 'pointer'); // torna o cabeçalho clicável

                        $(th).append(' <i class="fa fa-sort"></i>'); // insere icones de sort no cabeçalho das colunas

                    }

                });

                // GET/SET REST API URL - RESOURCE TO BE HANDLED
                // ================================
                self.remoteUrl = function ( url ) {

                    if (url){

                        remoteUrl = url;

                    } else {

                        return remoteUrl;

                    }

                }

                // GET/SET DATA TO BE SEND WITH AJAX CALL
                // ================================
                self.appendAjaxData = function ( appendData ) {

                    if (appendData){

                        appendAjaxData = appendData;

                    } else {

                        return appendAjaxData;

                    }

                }

                // IF THE CONFIG AJAXDATA IS SENT WHEN INSTANTIATING
                // ================================
                if (config.appendAjaxData) {

                    self.appendAjaxData(config.appendAjaxData);

                }

                // GET THE PAGE DATA
                // ================================
                self.pageData = function ( obj_id, obj_value ) {

                    if(obj_id) {

                        if(obj_value) {

                            var object = rawData.filter(function( obj ) {
                              return obj.id == obj_id;
                            })[0];

                            var object_pos = rawData.indexOf(object);

                            return rawData[object_pos] = obj_value;

                        } else {

                            return rawData.filter(function( obj ) {
                              return obj.id == obj_id;
                            })[0];
                        }

                    } else {

                        return rawData;
                    }

                }

                // GET THE SELECTED ROWS
                // ================================
                self.selecionados = function selecionados(){
                    var linhas_selecionadas = tabela.find('.bostable_select_row_checkbox:checked');
                    var objetos_selecionados = [];

                    if( linhas_selecionadas.length > 0 ){

                        $.each(linhas_selecionadas, function(index, linha){

                            var obj_id = $(linha).closest('tr').attr('data-object-id');

                            var objeto = rawData.filter(function( obj ) {
                              return obj.id == obj_id;
                            });

                            objetos_selecionados.push(objeto[0]);

                        });
                    }

                    return objetos_selecionados;
                }

                // APPLY TRIGGERS TO THE TABLE BUTTONS
                // ================================
                function aplicarGatilhosTabela(){

                    tabela.find('[data-crud-create]').unbind('click').on('click', function(){

                        var form_url = $(this).attr('data-crud-create');

                        self.abrirPostForm( form_url );

                    });

                    tabela.find('[data-crud-update]').unbind('click').on('click', function(){

                        var form_url = $(this).attr('data-crud-update');

                        var object_id = $(this).closest('tr').attr('data-object-id');

                        self.abrirPatchForm( form_url, object_id );

                    });

                    tabela.find('[data-crud-read]').unbind('click').on('click', function(){

                        var form_url = $(this).attr('data-crud-read');

                        var object_id = $(this).closest('tr').attr('data-object-id');

                        self.abrirGetForm( form_url, object_id );

                    });

                    tabela.find('[data-crud-drop]').unbind('click').on('click', function(){

                        var form_url = $(this).attr('data-crud-drop');

                        var object_id = $(this).closest('tr').attr('data-object-id')

                        self.abrirDeleteForm( form_url, object_id );

                    });

                    tabela.unbind('click', '.bostable_select_all_checkbox').on('click', '.bostable_select_all_checkbox', function(){

                        if(this.checked){

                            tabela.find('.bostable_select_row_checkbox').prop('checked', true);

                        } else {

                            tabela.find('.bostable_select_row_checkbox').prop('checked', false);

                        }

                    });

                }
                self.aplicarGatilhosTabela = aplicarGatilhosTabela;

                // APPLY TRIGGERS TO THE FORM BUTTONS
                // ================================
                function aplicarGatilhosForm( method, object_id ){

                    tabela.unbind('click', '[data-form-action*="close"]').on('click', '[data-form-action*="close"]', function(){

                        tabela.html(self.tablePageContent);

                        $(window).scrollTop(self.scroll);

                        aplicarGatilhosTabela();

                    });

                    tabela.find('form').on('submit', function( e ){

                        e.preventDefault();

                        var formData = $(this).serializeObject();

                        formData = $.extend(appendAjaxData, formData);

                        var resource = remoteUrl;

                        if( object_id ){

                            if(method == "patch" || method == "put" || method == "delete") {

                                resource += "id="+object_id;

                            } else {

                                formData.id = object_id;

                            }

                        }

                        formData.format = 'json';

                        console.log('iuiuh');

                        console.log(object_id);

                        $.ajax({
                            url: resource,
                            type: method,
                            data: formData,
                        
                        }).success( function (res) {
                            rawData.push(res);

                            tabela.html(self.tablePageContent);

                            $(window).scrollTop(self.scroll);

                            switch(method) {
                                case 'get':
                                    break;
                                case 'post':
                                    inserirLinha( res, 'prepend' );
                                    break;
                                case 'put':
                                    break;
                                case 'patch':
                                    editarLinha( res );
                                    break;
                                case 'delete':
                                    removerLinha( object_id );
                                    break;
                            }

                            aplicarGatilhosTabela();
                        
                        }).fail( function (a, b, c) {

                            console.log(a);

                            if( a.responseJSON ){

                                destacaCamposComProblemaEmForms( a.responseJSON );

                                mostraErro( a.responseJSON );

                            }

                        });

                        return false;

                    })

                }
                self.aplicarGatilhosForm = aplicarGatilhosForm;

                // HIGHLIGHT PROBEMATIC FIELDS
                // ================================
                function destacaCamposComProblemaEmForms( erros ){

                    tabela.find('.form-group').removeClass('has-error');

                    $.each( erros, function( index, erro ){

                        $("[name='"+index+"']").parents(".form-group").addClass('has-error');

                    });

                };

                // APPEND AN ERROR TO THE TABLE
                // ================================
                function mostraErro( erros, timer ){

                    var formAlertMsg = tabela.find('.alert');

                    if( formAlertMsg.length == 0 ){

                        formAlertMsg = $(document.createElement('div')).addClass("alert alert-danger");

                        tabela.prepend( formAlertMsg );

                    }

                    var errorString = '';

                    if(typeof erros === 'string'){

                        errorString = erros;

                    } else {

                        $.each(erros, function(index, error){

                            errorString += '<p>'+error+'</p>';

                        });

                    }

                    var alertTimer = timer ? timer : 5000;

                    formAlertMsg.html(errorString);

                    $(formAlertMsg).on('click', function(){

                        $(this).remove();

                    });

                    setTimeout(function(){formAlertMsg.remove()}, alertTimer);

                }

                self.mostraErro = mostraErro;

                // FUNCTION THAT GET THE DATA FROM THE REST API
                // ================================
                self.reloadRemoteData = function () {

                    page = config.page;

                    footer('<p class="text-center"><i class="fa fa-spin fa-circle-o-notch fa-2x"></i></p>');

                    $.get( remoteUrl, {
                        page : config.page
                        , limit : config.limit
                        , format: 'json'
                    })
                    .success(function( res, textStatus, request ){

                        rawData = res;

                        total_banco = request.getResponseHeader('X-Total-Count');

                        self.atualizarPaginacao();

                        tabela.find("tbody").empty();

                        $.each( res, function( index, obj ){

                            self.inserirLinha( obj );

                        });

                        aplicarGatilhosTabela();

                    })
                    .fail(function( res ){

                        footer( res.msg );

                    });

                };

                // FUNCTION THAT GET THE DATA FROM THE REST API
                // ================================
                self.loadRemoteData = function () {

                    page = config.page;

                    footer('<p class="text-center"><i class="fa fa-spin fa-circle-o-notch fa-2x"></i></p>');

                    $.get( remoteUrl, {
                        page : config.page
                        , limit : config.limit
                        , format: 'json'
                    })
                    .success(function( res, textStatus, request ){

                        rawData = res;

                        total_banco = request.getResponseHeader('X-Total-Count');

                        self.atualizarPaginacao();

                        $.each( res, function( index, obj ){

                            self.inserirLinha( obj );

                        });

                        aplicarGatilhosTabela();

                    })
                    .fail(function( res ){

                        footer( res.msg );

                    });

                };

                // GET THE DATA FROM THE REST API
                // ================================
                if (config.loadRemoteData != false) {

                    self.loadRemoteData();

                }

                // UPDATE THE PAGINATION TAB
                // ================================
                function atualizarPaginacao(){

                    page = page ? parseInt(page) : 1;

                    var totalPaginas = Math.ceil(total_banco / config.limit);

                    if( totalPaginas > 1 ){

                        var paginacao = '<div class="text-center"><ul class="pagination">';

                        paginacao += '<li><a href="'+remoteUrl+'page=1&limit='+config.limit+'">&laquo;</a></li>';

                        paginacao += '<li><a href="'+remoteUrl+'page='+(page > 2 ? page - 1 : 1)+'&limit='+config.limit+'">&lt;</a></li>';

                        for (var i = 1; i <= totalPaginas; i++) {
                            paginacao += '<li class="'+ (i == page ? 'active' : '') + '"><a href="'+remoteUrl+'page='+i+'&limit='+config.limit+'">'+i+' <span class="sr-only">(current)</span></a></li>';
                        };

                        paginacao += '<li><a href="'+remoteUrl+'page='+ ((page < totalPaginas) ? (page+1) : page) +'&limit='+config.limit+'">&gt;</a></li>';

                        paginacao += '<li><a href="'+remoteUrl+'page='+ totalPaginas +'&limit='+config.limit+'">&raquo;</a></li>';

                        paginacao += '</ul></div>';

                        footer( $(paginacao ) );

                    } else {

                        footer( '' );

                    }

                    var posicaoPrimeiroItem = total_banco > 0 ? (page * config.limit) + 1 - config.limit : 0;

                    var posicaoSegundoItem = (posicaoPrimeiroItem + config.limit - 1) > total_banco ? total_banco : posicaoPrimeiroItem + config.limit -1;

                    var totalresumeHTML = $(document.createElement('div')).addClass('text-center').html("Mostrando do " + posicaoPrimeiroItem + "&ordm até o " + posicaoSegundoItem + "&ordm de " + total_banco + " registro(s) encontrado(s).");

                    var captionContent = $(document.createElement('small')).addClass('text-info').append( totalresumeHTML );

                    self.caption( captionContent );

                }
                self.atualizarPaginacao = atualizarPaginacao;

                // UPDATE THE FOOTER
                // ================================
                function footer( conteudo ){

                    tabela.find('tfoot').remove();

                    var footer = elementoTfooter.clone();

                    content = $('<tr>').html( $('<td>').attr('colspan',elementoLinha.find('td').length).html( conteudo ) );

                    tabela.append( footer.append( content ) );

                }
                self.footer = footer;

                // AUPDATE THE TABLE TITLE
                // ================================
                function caption( content ){

                    var caption = elementoCaption.clone();

                    tabela.find('.bostable_head').remove();

                    tabela.prepend( caption.append( content ) );

                    aplicarGatilhosTabela();

                }
                self.caption = caption;

                // ATTACH A NEW ROW TO THE TABLE
                // ================================
                function inserirLinha( objeto, pos, highlight ){

                    // define a posição da nova linha
                    var pos = ( pos === "append" || pos === "prepend" ) ? pos : "append";

                    // cria uma nova linha da tabela
                    var linha = elementoLinha.clone();

                    // define o identificador da nova linha
                    linha.attr("data-object-id", objeto.id );

                    // popula a linha
                    linha.dataBind(objeto);

                    // se a opção highlight estiver setada como true
                    if( highlight ){

                        // cria um efeito visual na nova linha
                        linha.addClass("success");

                        // após 4 segundos
                        setTimeout(function(){

                            // remove o efeito visual da nova linha
                            linha.removeClass("success");

                        },2400);

                    };

                    // insere a nova linha na tabela
                    linha.hide()[pos+"To"]( tabela.find("tbody") ).fadeIn( "slow" );

                    // atualiza a classe de orednação
                    self.atualizaOrdenacao();

                };
                self.inserirLinha = inserirLinha;

                // REMOVE A ROW FROM THE TABLE USING ITS ID AS REFERENCE
                // ================================
                function removerLinha( id ){

                    // instancia a linha da tabela
                    var linha = tabela.find( '[data-object-id="'+id+'"]' );

                    // insere um efeito na linha
                    linha.addClass("danger");

                    // apaga a linha lentamente
                    linha.fadeOut("slow", function(){

                        // remove a linha da tabela
                        linha.remove();

                        // atualiza a classe de orednação
                        self.atualizaOrdenacao();

                    });

                };
                self.removerLinha = removerLinha;

                // UPDATE THE TABLE ORDERING
                // ================================
                function atualizaOrdenacao(){

                    var resort = true, callback = function(table){};

                    tabela.trigger("update", [resort, callback]);

                };
                self.atualizaOrdenacao = atualizaOrdenacao;

                // UPDATE A LINE IN THE TABLE USING ITS ID AS REFERENCE
                // ================================
                function editarLinha( objeto ){

                    // instancia a linha da tabela
                    var linha = tabela.find( '[data-object-id="'+objeto.id+'"]' );

                    // para cada atributo do objeto
                    $.each( objeto, function( attribute, value ){

                        var elemento = linha.find( "." + attribute );

                        if( elemento.length > 0 ){

                            // preenche a respectiva coluna da linha com seu valor
                            elemento.html( value );

                            if( elemento.get(0).tagName == "IMG" ){

                                elemento.attr("src", value );

                            }

                        }

                    });

                    // cria um efeito visual na linha editada
                    linha.addClass("success");

                    // após 4 segundos
                    setTimeout(function(){

                        // remove o efeito visual da linha editada
                        linha.removeClass("success");

                    },2400);

                    // atualiza a classe de orednação
                    self.atualizaOrdenacao();

                };
                self.editarLinha = editarLinha;

                // EMPTY THE TABLE BODY
                // ================================
                self.emptyBody = function (){

                    tabela.find("tbody").empty();

                }

                // EMPTY THE TABLE
                // ================================
                function limpar(){

                    tabela.find("tbody").empty();

                    tabela.find("tfoot").remove();

                    tabela.find("caption").remove();

                }
                self.limpar = limpar;

                // SHOWS THE CRUD FORMS
                // ================================
                function showForm( method, object_id ){

                    var formulario = self[method+'Form'].clone();

                    self.tablePageContent = tabela.html(); // salva a tabela

                    self.scroll = $(window).scrollTop(); // salva a posição na tela

                    if( method == 'get' || method == 'patch' ){

                        $.get( remoteUrl, {
                            id: object_id
                            , format: 'json'
                        })
                        .success(function(res){

                            // popula formulario
                            formulario.dataBind(res);

                            tabela.html(formulario);

                            aplicarGatilhosForm( method, object_id );

                        })
                        .fail(function(res, b, c){

                            mostraErro( res );

                        });

                    } else {

                        tabela.html(formulario);

                        aplicarGatilhosForm( method, object_id );

                    }

                }

                // OPEN THE NEW ITEM FORM
                // ================================
                function abrirPostForm( form_url ){

                    if( ! self.postForm ){

                        $.get( form_url, appendAjaxData)
                        .success(function(form){

                            self.postForm = $(form);

                            showForm( 'post' );

                        })
                        .fail(function(res){
                            mostraErro( 'Falha ao carregar o formulário de criação: ' + form_url);
                        });

                    } else
                        showForm( 'post' );



                }
                self.abrirPostForm = abrirPostForm;

                // OPEN THE EDIT ITEM FORM
                // ================================
                function abrirPatchForm( form_url, object_id ){

                    if( ! self.patchForm ){

                        $.get( form_url )
                        .success(function(form){

                            self.patchForm = $(form);

                            showForm( 'patch', object_id );

                        })
                        .fail(function(res){
                            mostraErro( 'Falha ao carregar o formulário de edição: ' + form_url);
                        });

                    } else
                        showForm( 'patch', object_id );

                }
                self.abrirPatchForm = abrirPatchForm;

                // OPEN THE VIEW ITEM FORM
                // ================================
                function abrirGetForm( form_url, object_id ){

                    if( ! self.getForm ){

                        $.get( form_url )
                        .success(function(form){

                            self.getForm = $(form);

                            showForm( 'get', object_id );

                        })
                        .fail(function(res){
                            mostraErro( 'Falha ao carregar a tela de visualização: ' + form_url );
                        });

                    } else
                        showForm( 'get', object_id );

                }
                self.abrirGetForm = abrirGetForm;

                // OPEN THE DROP ITEM FORM
                // ================================
                function abrirDeleteForm( form_url, object_id ){

                    if( ! self.deleteForm ){

                        $.get( form_url )
                        .success(function(form){

                            self.deleteForm = $(form);

                            showForm( 'delete', object_id );

                        })
                        .fail(function(res){
                            mostraErro( 'Falha ao carregar o formulário de remoção: ' + form_url);
                        });

                    } else
                        showForm( 'delete', object_id );

                }
                self.abrirDeleteForm = abrirDeleteForm;
            };

            // RETURN THE OBJECT TO BE USED BY OTHERS PLUGINS
            // ==============================================
            return this;
        }

    });

    // MAPS THE DOM SEARCHING FOR TABLES IWTH BOSTABLE CLASS
    // ================================
    // identifica todas as tabelas com classe bostable do documento
    var tabelas = $(document).find(".bostable");

    // para cada tabela encontrada
    $.each( tabelas, function(i, tabela ){

        $(tabela).bostable();

    });

});

if (typeof url_parameter != 'function') {
    // Get parameters from url
    function url_parameter(sParam)
    {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++) 
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) 
            {
                return sParameterName[1];
            }
        }
    }
}
