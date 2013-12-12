var IPython = (function (IPython) {
    "use strict"; 

    var Fbase = function(){
        this.loadFirebase();
    }

    Fbase.prototype.loadFirebase = function(){
        $.ajax({
            url: "https://cdn.firebase.com/v0/firebase.js",
            dataType: "script",
            cache: true,
            success: $.proxy(this.initFirebase, this)
        });
    }

    Fbase.prototype.initFirebase = function(){
        //TODO figure out a namespacing for separate notebook projects
        this.baseURI = 'https://ipython-dev.firebaseio.com';
        this.myDataRef = new Firebase(this.baseURI);

        var that = this;
        console.log("initializing firebase");

        var initAllCells = function(){
            var cells = IPython.notebook.get_cells();
            $.each(cells, function(index, cell){
                var cellId = cell.get_id();
                that.initCellComments(cellId);
            });
        }

        $([IPython.events]).on('select.Cell', function(cell){

        });

        if(IPython.notebook.session === null){
            $([IPython.events]).on('notebook_loaded.Notebook', initAllCells)
        } else{
            initAllCells()
        }
    }

    Fbase.prototype.initCellComments = function(cellId){
        var url = this.baseURI + "/cells/" + cellId + "/comments/";
        var cellCommentsDataRef = new Firebase(url);

        var that = this;
        cellCommentsDataRef.on('child_added', function(snapshot){
            var comment = snapshot.val();
            comment.comment_id = snapshot.name();
            that.updateCellComments(comment);
        });
    }

    Fbase.prototype.submitComment = function(comment_obj){
        var cellId = comment_obj.cell_id;
        var url = this.baseURI + '/cells/' + cellId + "/comments/"; 
        var commentListRef = new Firebase(url);

        // Generate a reference to a new location with push
        var newPushRef = commentListRef.push();

        newPushRef.set(comment_obj);

        console.log(newPushRef.name());
    }


    Fbase.prototype.updateCellComments = function(comment){
        var parentCell = IPython.notebook.get_cell_by_id(comment.cell_id);
        if(parentCell){
            if (!parentCell.hasOwnProperty("comments")){
                parentCell.comments = [];
            }
            parentCell.comments.push(comment);

            //If the current cell is selected, append it to the widget
            if (IPython.notebook.get_selected_cell().get_id() === parentCell.get_id()){
                IPython.comment_widget.insert_comment(comment);
            }
        }
    }


    IPython.Fbase = Fbase;
    return IPython

}(IPython));
