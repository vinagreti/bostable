Bostable
========

Jquery DataTable that implements REST operations.

Bostable is a plugin based on JQuery to make easy CRUD operations via REST Api.

  - List resourses
  - View resource details
  - Edit resource details
  - Remove reource


Bostable is a lightweight plugin that helps you in your daily CRUD implementation. With Bostable you can focus on your business rules and let the CRUD operations to be done in an easy way.

Version
----

0.6

Tech
-----------

Bostable uses JQuery to power up the functionalities:

Installation
--------------

```sh
<script type="text/javascript" src="bostable.js"></script>
```

Usage
-----
To use the plugin you have two options.

#### Via HTML
To use Bostable via HTML, ou need to load the HTML before the Bostable.js. When the plugin is loaded, it's maps the DOM looking for tables with bostable class,
```sh
<div class="table-responsive">
    <table class="bostable table table-hover table-condensed table-striped" id="tabelaProjetos" data-url="<?=base_url()?>projetos">
        <thead>
            <th class="col-sm-1" ordenavel>ID</th>
            <th ordenavel>Nome</th>
            <th class="col-sm-3" ordenavel>Status</th>
            <th class="col-sm-1">Ações</th>
        </thead>
        <tbody>
            <tr>
                <td class="id"></td>
                <td class="nome"></td>
                <td class="status"></td>
                <td><span class="menuLinhaTabela">
                    <button type="button" class="btn btn-info btn-xs editarUsuario" data-crud-read="<?=base_url()?>projetos/aprovarTemplate" data-toggle="tooltip" title="Aprovar projeto"><i class="fa fa-power-off"></i></button>
                </span></td>
            </tr>
        </tbody>
    </table>
</div>
```

#### Via JavaScript
To use Bostable via JS, you need to load the HTML and apply the $.bostable() on it.
```sh
<table class="bostable table table-hover table-condensed table-striped" id="projetoEtapas" data-url="<?=base_url()?>projetos/etapas">
    <thead>
        <th class="col-sm-2" ordenavel>ID</th>
        <th ordenavel>Descrição</th>
    </thead>
    <tbody>
        <tr>
            <td class="id"></td>
            <td class="subject"></td>
        </tr>
    </tbody>
</table>

<script type="text/javascript">

$(document).ready(function(){

    $('#projetoEtapas').attr('data-url', base_url + 'projetos/' + $('#projetoID').html() + '/etapas');

    $('#projetoEtapas').bostable();

});
```

License
----

MIT


