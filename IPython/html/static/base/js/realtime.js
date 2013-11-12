    function initializeModel(model) {
      var string = model.createString('Hello Realtime World!');
      model.getRoot().set('text', string);
      var book = model.create('Book');
      book.title = 'Moby Dick';
      book.author = 'Melville, Herman';
      book.isbn = '978-1470178192';
      book.isCheckedOut = false;
      model.getRoot().set('book', book);
    }



    function initializeComment(model){
      var comment = model.create('Comment');
      comment.title = '';  // Subject of the comment -> do we want this?
      comment.author = 'Melville, Herman'; // Currently a name -> should replace with User object
      comment.parentComment = null; // ID of the parent comment. Comments default to being standalone
      comment.time = null;
      comment.embeddedFields = false; // Used for embedded code cells, etc.
      model.getRoot().set('comment', comment);
    }


  



    /**
     * This function is called when the Realtime file has been loaded. It should
     * be used to initialize any user interface components and event handlers
     * depending on the Realtime model. In this case, create a text control binder
     * and bind it to our string model that we created in initializeModel.
     * @param doc {gapi.drive.realtime.Document} the Realtime document.
     */
    function onFileLoaded(doc) {

      kc = doc;
      var string = doc.getModel().getRoot().get('text');

      // Keeping one box updated with a String binder.
      var textArea1 = document.getElementById('editor1');
      gapi.drive.realtime.databinding.bindString(string, textArea1);

      // Keeping one box updated with a custom EventListener.
      var textArea2 = document.getElementById('editor2');
      var updateTextArea2 = function(e) {
        textArea2.value = string;
      };
      string.addEventListener(gapi.drive.realtime.EventType.TEXT_INSERTED, updateTextArea2);
      string.addEventListener(gapi.drive.realtime.EventType.TEXT_DELETED, updateTextArea2);
      textArea2.onkeyup = function() {
        string.setText(textArea2.value);
      };
      updateTextArea2();



      /**
       * The actions to take when a notebook has changed (remotely)
       * Check if any comments have been added/deleted
       * If so, update them locally
       */
      var doNotebookChanged= function(e) {
        console.log("IPython Notebook Changed");
      };


      var book = doc.getModel().getRoot().get('book');

      var book = doc.getModel().getRoot().get('notebook');
      book.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, doNotebookChanged);

      // Enabling UI Elements.
      textArea1.disabled = false;
      textArea2.disabled = false;

      // Add logic for undo button.
      var model = doc.getModel();
      var undoButton = document.getElementById('undoButton');
      var redoButton = document.getElementById('redoButton');

      undoButton.onclick = function(e) {
        model.undo();
      };
      redoButton.onclick = function(e) {
        model.redo();
      };

      // Add event handler for UndoRedoStateChanged events.
      var onUndoRedoStateChanged = function(e) {
        undoButton.disabled = !e.canUndo;
        redoButton.disabled = !e.canRedo;
      };
      model.addEventListener(gapi.drive.realtime.EventType.UNDO_REDO_STATE_CHANGED, onUndoRedoStateChanged);
    }

    var myApp = {};

    function registerTypes(){

      myApp.Notebook= function() {}
      myApp.Notebook.prototype.id = "" // Not a collaborative field
      myApp.Notebook.prototype.id = gapi.drive.realtime.custom.collaborativeField('cells');

      myApp.Cell = function() {}

      myApp.Comment = function() {}

      myApp.Quiz= function() {}


      gapi.drive.realtime.custom.registerType(myApp.Notebook, 'Notebook');
      gapi.drive.realtime.custom.registerType(myApp.Notebook, 'Cell');
      gapi.drive.realtime.custom.registerType(myApp.Notebook, 'Comment');



      /**
       * A Notebook is a Drive model corresponding to the actual IPython notebook itself
       * @param id {String} Some unique identifier corresponding to this notebook (name/title may be a part of it, but may not be sufficient, esp. if instructor can rename the notebook
       * TODO figure out this identifier
       * @param cellIds {String[]} An array of the unique identifiers for the cells in this notebook
       */

      function initializeNotebook(id, cellIds){
        var model = gapi.drive.realtime.custom.getModel(this);
        this.id = id;
        this.cells = model.createMap();

      }

      myapp.Notebook.prototype.getCellById = function(id){
        return this.cells.get(id);
      }


      /**
       * A Cell is a Drive model corresponding to an IPython cell
       * It does not duplicate all of the information contained in the IPython cell
       * It only contains as much as is needed in order to synchronize the data
       * @param id {String} the unique identifier corresponding to the IPython cell
       */
      function initializeCell(opt_id){
        var model = gapi.drive.realtime.custom.getModel(this);
        if (opt_id){
          this.id = opt_id;
        }
        this.comments = model.createList();
      }

      myApp.Cell.prototype.addComment = function(comment){
        this.comments.push(comment);
        console.log('Added comment locally. Current comment count: ' + this.comments.length);
      };


      myApp.Cell.prototype.getComments= function(){
        return this.comments.toArray();
      };


      gapi.drive.realtime.custom.setOnLoaded(myapp.Cell, onLoadCell);

      function onLoadCell(){
        // "this" is the newly created object, 
        // because onLoaded is called in the context of the local object

        // If the object is changed (ie, comments have been added), we need to update this locally
        // updateCommentsLocally handles client-side rendering of the comments in the local IPython notebook
        // TODO implement updateCommentsLocally
        this.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, updateCommentsLocally);
      }



      /**
       * A Comment is a Drive representation of a comment that is rendered in an IPython notebook
       * A Comment is by definition attached to a cell
       * @param cellId {String} the unique identifier corresponding to the IPython cell that this comment refers to ("comments on")
       * @param content {String} The text/content of the comment itself
       * @param opt_childId {String} The id of the IPython cell (if any) embedded in this comment
       */
      function initializeComment(cellId, content, opt_childId){
        var model = gapi.drive.realtime.custom.getModel(this);
        this.cellId = cellId
          this.content = content
          if (opt_childId){
            this.childId = opt_childId;
          }

        // TODO figure out the process to fetch a cell, given its ID
        var cell = this.getNotebook().getCellById(cellId);
        cell.addComment(this);
      }

      gapi.drive.realtime.custom.setInitializer(myApp.Cell, initializeNotebook);
      gapi.drive.realtime.custom.setInitializer(myApp.Cell, initializeCell);
      gapi.drive.realtime.custom.setInitializer(myApp.Comment, initializeComment);



    }

    /**
     * Options for the Realtime loader.
     */
    var realtimeOptions = {
      /**
       * Client ID from the console.
       */
      clientId: '620726701142-59mnlk45v4mqc5ksso11pnvrqvscvr80.apps.googleusercontent.com',

      /**
       * The ID of the button to click to authorize. Must be a DOM element ID.
       */
      authButtonElementId: 'authorizeButton',

      /**
       * Function to be called when a Realtime model is first created.
       */
      initializeModel: initializeModel,

      /**
       * Autocreate files right after auth automatically.
       */
      autoCreate: true,

      /**
       * The name of newly created Drive files.
       */
      defaultTitle: "New Realtime Quickstart File",

      /**
       * The MIME type of newly created Drive Files. By default the application
       * specific MIME type will be used:
       *     application/vnd.google-apps.drive-sdk.
       */
      newFileMimeType: null, // Using default.

      /**
       * Function to be called every time a Realtime file is loaIf the object is changed (ie, comments have been added), we need to update this locally
       */
      onFileLoaded: onFileLoaded,

      /**
       * Function to be called to inityalize custom Collaborative Objects types.
       */
      registerTypes: registerTypes, // No action.

      /**
       * Function to be called after authorization and before loading files.
       */
      afterAuth: null // No action.
    }

    /**
     * Start the Realtime loader with the options.
     */
    function startRealtime() {
      var realtimeLoader = new rtclient.RealtimeLoader(realtimeOptions);
      realtimeLoader.start();
    }
