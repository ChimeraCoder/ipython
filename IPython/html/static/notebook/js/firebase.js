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
        this.myDataRef.on('child_added', function(snapshot) {
            var message = snapshot.val();
            that.displayComment(message.parentCellId, message.name, message.text);
        });
    }

    Fbase.prototype.submitComment = function(cellId, userId, comment_obj){
        var url = this.baseURI + '/cells/' + cellId + "/comments/"; 
        var commentListRef = new Firebase(url);

        // Generate a reference to a new location with push
        var newPushRef = commentListRef.push();

        newPushRef.set(comment_obj);

        console.log(newPushRef.name());
    }


    Fbase.prototype.displayComment = function(parentCellId, username, text){
        console.log("Displaying message for " + parentCellId + " " + username + " " + text);
    }

    IPython.Fbase = Fbase;
    return IPython

}(IPython));
