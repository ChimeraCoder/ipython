//----------------------------------------------------------------------------
//  Copyright (C) 2011  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

//============================================================================
// Drive NotebookList
//============================================================================

var IPython = (function (IPython) {
    "use strict";
    
    var utils = IPython.utils;

    var DriveNotebookList = function (selector) {
        this.selector = selector;
        if (this.selector !== undefined) {
            this.element = $(selector);
            this.style();
            this.bind_events();
        }
        this.notebooks_list = [];
        this.sessions = {};
    };

    DriveNotebookList.prototype.baseProjectUrl = function () {
        return $('body').data('baseProjectUrl');
    };

    DriveNotebookList.prototype.notebookPath = function() {
        return $('body').data('notebookPath');
    };
    
    DriveNotebookList.prototype.style = function () {
        $('#drive_notebook_toolbar').addClass('list_toolbar');
        $('#drive_drag_info').addClass('toolbar_info');
        $('#drive_notebook_buttons').addClass('toolbar_buttons');
        $('#drive_notebook_list_header').addClass('list_header');
        this.element.addClass("list_container");
    };


    DriveNotebookList.prototype.bind_events = function () {
        var that = this;
        $('#drive_refresh_notebook_list').click($.proxy(this.load_drive_list, this));
        $([IPython.events]).on('authorization_required.GoogleDrive', $.proxy(this.handle_authorization_required, this));
        $([IPython.events]).on('authorization_complete.GoogleDrive', $.proxy(this.handle_authorization_complete, this));
        $('#drive_authorize').click($.proxy(this.authorize_drive, this));
        $('#drive_revoke').click($.proxy(this.revoke_drive, this));
        this.element.bind('dragover', function () {
            return false;
        });
        this.element.bind('drop', function(event){
            that.handelFilesUpload(event,'drop');
            return false;
        });
    };


    DriveNotebookList.prototype.handle_authorization_required = function () {
        $('#drive_authorize').removeClass('hide');
        $('#drive_revoke').addClass('hide');
        this.clear_list();
    }

    DriveNotebookList.prototype.handle_authorization_complete = function () {
        $('#drive_authorize').addClass('hide');
        $('#drive_revoke').removeClass('hide');
    }

    DriveNotebookList.prototype.authorize_drive = function () {
        IPython.google_drive.authorize();
    }

    DriveNotebookList.prototype.revoke_drive = function () {
        IPython.google_drive.revoke();
    }

    DriveNotebookList.prototype.handelFilesUpload =  function(event, dropOrForm) {
        var that = this;
        var files;
        if(dropOrForm =='drop'){
            files = event.originalEvent.dataTransfer.files;
        } else 
        {
            files = event.originalEvent.target.files;
        }
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            var reader = new FileReader();
            reader.readAsText(f);
            var name_and_ext = utils.splitext(f.name);
            var nbname = name_and_ext[0];
            var file_ext = name_and_ext[-1];
            if (file_ext === '.ipynb') {
                var item = that.new_notebook_item(0);
                that.add_name_input(nbname, item);
                // Store the notebook item in the reader so we can use it later
                // to know which item it belongs to.
                $(reader).data('item', item);
                reader.onload = function (event) {
                    var nbitem = $(event.target).data('item');
                    that.add_notebook_data(event.target.result, nbitem);
                    that.add_upload_button(nbitem);
                };
            } else {
                var dialog = 'Uploaded notebooks must be .ipynb files';
                IPython.dialog.modal({
                    title : 'Invalid file type',
                    body : dialog,
                    buttons : {'OK' : {'class' : 'btn-primary'}}
                });
            }
        }
        return false;
    };

    DriveNotebookList.prototype.clear_list = function () {
        this.element.children('.list_item').remove();
    };

    DriveNotebookList.prototype.load_sessions = function(){
        var that = this;
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(that.sessions_loaded, this)
        };
        var url = this.baseProjectUrl() + 'api/sessions';
        $.ajax(url,settings);
    };


    DriveNotebookList.prototype.sessions_loaded = function(data){
        this.sessions = {};
        var len = data.length;
        if (len > 0) {
            for (var i=0; i<len; i++) {
                var nb_path;
                if (!data[i].notebook.path) {
                    nb_path = data[i].notebook.name;
                }
                else {
                    nb_path = utils.url_path_join(
                        data[i].notebook.path,
                        data[i].notebook.name
                    );
                }
                this.sessions[nb_path] = data[i].id;
            }
        }
        this.load_drive_list();
    };

    DriveNotebookList.prototype.load_drive_list = function () {
        var that = this;
        IPython.google_drive.wait_for_drive_api(function(){
            var request =  gapi.client.drive.files.list();
            request.execute($.proxy(that.drive_list_loaded, that));
        });
    }

    DriveNotebookList.prototype.drive_list_loaded = function (resp){

        var data = $.grep(resp.items, function(item, index) {
            return item.fileExtension=="ipynb";
        });
        var len = data.length;
        this.clear_list();
        if (len === 0) {
            $(this.new_notebook_item(0))
                .append(
                    $('<div style="margin:auto;text-align:center;color:grey"/>')
                    .text("Notebook list empty.")
                );
        }
        for (var i=0; i<len; i++) {
            var name = data[i].title;
            var id = data[i].id;
            var item = this.new_notebook_item(i);
            this.add_link(id, name, item);
            if(this.sessions[name] === undefined){
                this.add_delete_button(item);
            } else {
                this.add_shutdown_button(item,this.sessions[name]);
            }
        }
    }


    DriveNotebookList.prototype.new_notebook_item = function (index) {
        var item = $('<div/>').addClass("list_item").addClass("row-fluid");
        // item.addClass('list_item ui-widget ui-widget-content ui-helper-clearfix');
        // item.css('border-top-style','none');
        item.append($("<div/>").addClass("span12").append(
            $("<a/>").addClass("item_link").append(
                $("<span/>").addClass("item_name")
            )
        ).append(
            $('<div/>').addClass("item_buttons btn-group pull-right")
        ));
        
        if (index === -1) {
            this.element.append(item);
        } else {
            this.element.children().eq(index).after(item);
        }
        return item;
    };


    DriveNotebookList.prototype.add_link = function (id, nbname, item) {
        item.data('nbname', nbname);
        item.data('fileid', id);
        item.find(".item_name").text(nbname);
        item.find("a.item_link")
            .attr('href',
                utils.url_path_join(
                    this.baseProjectUrl(),
                    "notebooks",
                    this.notebookPath(),
                    "gdrive:"+id
                )
            ).attr('target','_blank');
    };


    DriveNotebookList.prototype.add_name_input = function (nbname, item) {
        item.data('nbname', nbname);
        item.find(".item_name").empty().append(
            $('<input/>')
            .addClass("nbname_input")
            .attr('value', nbname)
            .attr('size', '30')
            .attr('type', 'text')
        );
    };


    DriveNotebookList.prototype.add_notebook_data = function (data, item) {
        item.data('nbdata', data);
    };


    DriveNotebookList.prototype.add_shutdown_button = function (item, session) {
        var that = this;
        var shutdown_button = $("<button/>").text("Shutdown").addClass("btn btn-mini").
            click(function (e) {
                var settings = {
                    processData : false,
                    cache : false,
                    type : "DELETE",
                    dataType : "json",
                    success : function () {
                        that.load_sessions();
                    }
                };
                var url = utils.url_path_join(
                    that.baseProjectUrl(),
                    'api/sessions',
                    session
                );
                $.ajax(url, settings);
                return false;
            });
        // var new_buttons = item.find('a'); // shutdown_button;
        item.find(".item_buttons").html("").append(shutdown_button);
    };

    DriveNotebookList.prototype.add_delete_button = function (item) {
        var new_buttons = $('<span/>').addClass("btn-group pull-right");
        var notebooklist = this;
        var delete_button = $("<button/>").text("Delete").addClass("btn btn-mini").
            click(function (e) {
                // $(this) is the button that was clicked.
                var that = $(this);
                // We use the nbname and notebook_id from the parent notebook_item element's
                // data because the outer scopes values change as we iterate through the loop.
                var parent_item = that.parents('div.list_item');
                var nbname = parent_item.data('nbname');
                var message = 'Are you sure you want to permanently delete the notebook: ' + nbname + '?';
                IPython.dialog.modal({
                    title : "Delete notebook",
                    body : message,
                    buttons : {
                        Delete : {
                            class: "btn-danger",
                            click: function() {
                                var settings = {
                                    processData : false,
                                    cache : false,
                                    type : "DELETE",
                                    dataType : "json",
                                    success : function (data, status, xhr) {
                                        parent_item.remove();
                                    }
                                };
                                var url = utils.url_path_join(
                                    notebooklist.baseProjectUrl(),
                                    'api/notebooks',
                                    notebooklist.notebookPath(),
                                     nbname + '.ipynb'
                                );
                                $.ajax(url, settings);
                            }
                        },
                        Cancel : {}
                    }
                });
                return false;
            });
        item.find(".item_buttons").html("").append(delete_button);
    };


    DriveNotebookList.prototype.add_upload_button = function (item) {
        var that = this;
        var upload_button = $('<button/>').text("Upload")
            .addClass('btn btn-primary btn-mini upload_button')
            .click(function (e) {
                var nbname = item.find('.item_name > input').val();
                var nbdata = item.data('nbdata');
                var content_type = 'application/json';
                var model = {
                    content : JSON.parse(nbdata),
                };
                var settings = {
                    processData : false,
                    cache : false,
                    type : 'POST',
                    dataType : 'json',
                    data : JSON.stringify(model),
                    headers : {'Content-Type': content_type},
                    success : function (data, status, xhr) {
                        that.add_link(data, nbname, item);
                        that.add_delete_button(item);
                    },
                    error : function (data, status, xhr) {
                        console.log(data, status);
                    }
                };

                var url = utils.url_path_join(
                    that.baseProjectUrl(),
                    'api/notebooks',
                    that.notebookPath(),
                    nbname + '.ipynb'
                );
                $.ajax(url, settings);
                return false;
            });
        var cancel_button = $('<button/>').text("Cancel")
            .addClass("btn btn-mini")
            .click(function (e) {
                console.log('cancel click');
                item.remove();
                return false;
            });
        item.find(".item_buttons").empty()
            .append(upload_button)
            .append(cancel_button);
    };


    DriveNotebookList.prototype.new_notebook = function(){
        var path = this.notebookPath();
        var base_project_url = this.baseProjectUrl();
        var settings = {
            processData : false,
            cache : false,
            type : "POST",
            dataType : "json",
            async : false,
            success : function (data, status, xhr) {
                var notebook_name = data.name;
                window.open(
                    utils.url_path_join(
                        base_project_url,
                        'notebooks',
                        path,
                        notebook_name),
                    '_blank'
                );
            }
        };
        var url = utils.url_path_join(
            base_project_url,
            'api/notebooks',
            path
        );
        $.ajax(url, settings);
    };

    IPython.DriveNotebookList = DriveNotebookList;

    return IPython;

}(IPython));
