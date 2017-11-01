/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-ready.html"
];

var i = 0;
var trials = 9;
/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

/********************
* STROOP TEST       *
********************/
var StroopExperiment = function() {

	var wordon, // time word is presented
	    listening = false;

	// Stimuli for a basic Stroop experiment
	var stims = [
			["SHIP", "red", "unrelated"],
			["MONKEY", "green", "unrelated"],
			["ZAMBONI", "blue", "unrelated"],
			["RED", "red", "congruent"],
			["GREEN", "green", "congruent"],
			["BLUE", "blue", "congruent"],
			["GREEN", "red", "incongruent"],
			["BLUE", "green", "incongruent"],
			["RED", "blue", "incongruent"]
		];

	stims = _.shuffle(stims);

	var next = function() {
		if (i == trials) {
			finish();
		}
		else {
			stim = stims.shift();
			show_word( stim[0], stim[1] );
			wordon = new Date().getTime();
			listening = true;
			d3.select("#query").html('<p id="prompt">Type "R" for Red, "B" for blue, "G" for green.</p>');
			d3.select("#query").html('<p id="count"></p>');
			document.getElementById("count").innerHTML = i;
			threeDstuff();
			i = i+1;
		}
		
	};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode,
			response;

		switch (keyCode) {
			case 82:
				// "R"
				response="red";
				break;
			case 71:
				// "G"
				response="green";
				break;
			case 66:
				// "B"
				response="blue";
				break;
			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			var hit = response == stim[1];
			var rt = new Date().getTime() - wordon;

			psiTurk.recordTrialData({'phase':"TEST",
                                     'word':stim[0],
                                     'color':stim[1],
                                     'relation':stim[2],
                                     'response':response,
                                     'hit':hit,
                                     'rt':rt}
                                   );
			remove_word();
			next();
		}
	};

	var finish = function() {
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new Questionnaire();
	};
	
	var show_word = function(text, color) {
		d3.select("#stim")
			.append("div")
			.attr("id","word")
			.style("color",color)
			.style("text-align","center")
			.style("font-size","150px")
			.style("font-weight","400")
			.style("margin","20px")
			.text(text);
	};

	var remove_word = function() {
		d3.select("#word").remove();
	};

	var threeDstuff = function() {
		if (i == 0) {
			var scene = new THREE.Scene();
        // create a camera, which defines where we're looking at.
        //var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
		var camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);

        // create a render and set the size
        var webGLRenderer = new THREE.WebGLRenderer();
        webGLRenderer.setClearColor(new THREE.Color(0x000000, 1.0));
        //webGLRenderer.setSize(window.innerWidth, window.innerHeight);
        webGLRenderer.setSize(800, 600);
        webGLRenderer.shadowMapEnabled = false;

        // position and point the camera to the center of the scene
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 50;
        camera.lookAt(new THREE.Vector3(0, 0, 0));


        // add spotlight for the shadows
        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(0, 0, 30);
        spotLight.intensity = 2;
        scene.add(spotLight);

        // add the output of the renderer to the html element
        document.getElementById("3dstuff").appendChild(webGLRenderer.domElement);

        // call the render function
        var step = 0;

        // setup the control gui
        var controls = new function () {
            // we need the first child, since it's a multimaterial

        };
        //Create randomiztion for object displayed
        var fruitsOBJ = [
        	['../static/images/objects/apple_18.obj'],
        	['../static/images/objects/banana8.obj'],
        	['../static/images/objects/coconut_4.obj']
        	];
        var fruitsJPG = [
        ['apple_18.jpg'],
        ['banana8.jpg'],
        ['coconut_4.jpg']
        ];
        var rdm;
        var fruitOBJ = Array(trials);
        var fruitJPG = Array(trials);
        var group = Array(trials);
        var meshes = Array(trials);
        var loaders = Array(trials);
        var j;
        for (j = 0; j < trials; j++) {
        shuffleFruits();
        fruitOBJ[j] = fruitsOBJ[rdm-1];
        fruitJPG[j] = fruitsJPG[rdm-1];
        
		

        //var gui = new dat.GUI();
        group[j] = new THREE.Group();
        loaders[j] = new THREE.OBJLoader();

        loaders[j].load(fruitOBJ[j], function (object) {

            object.children.forEach(function(child) {
                //child.geometry.computeFaceNormals();
                //child.geometry.computeVertexNormals();

                //child.geometry.center();
                //child.geometry.verticesNeedUpdate = true;
            });

            //console.log(bbox);
            //object.rotation.x = 0.2;
            //object.rotation.y = -1.3;

            // configure the wings
            meshes[j] = createMesh(object.children[0].geometry, fruitJPG[j]);

            var box = new THREE.Box3().setFromObject( meshes[j] );
            box.center( meshes[j].position ); // this re-sets the mesh position
            meshes[j].position.multiplyScalar( - 1 );
        });
        group[j].add(meshes[j])}


            scene.add( group[i] );
            group[i].add( meshes[i] );
            //scene.add(mesh);
		}
		else {
			scene.remove(group[i-1]);
			scene.add(group[i]);
			
		}
        render();

        // get bounding box so we can translate the object so its center is at 0,0,0
        // var bbox = new THREE.Box3().setFromObject(mesh);
        // mesh.children[0].geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
        //     -((bbox.max.x - bbox.min.x)/2 + bbox.min.x), 
        //     -((bbox.max.y - bbox.min.y)/2 + bbox.min.y)),
        //     -((bbox.max.z - bbox.min.z)/2 + bbox.min.z));
        // mesh.children[0].geometry.verticesNeedUpdate = true;
         function shuffleFruits() {
        	do {
        		rdm = Math.floor(Math.random() * 10);
        	}
        	while (rdm > 3 || rdm < 1);
        	}


        function createMesh(geom, imageFile) {
            var texture = THREE.ImageUtils.loadTexture("../static/images/objects/" + imageFile)
            var mat = new THREE.MeshPhongMaterial();
            mat.map = texture;
            var mesh = new THREE.Mesh(geom, mat);
            return mesh;
        }


        function render() {
            if (group[i]) {
                group[i].rotation.y += 0.006;
            }

            // render using requestAnimationFrame
            requestAnimationFrame(render);
            webGLRenderer.render(scene, camera);
        }
	};
	
	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 

	// Start the test
	next();
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {

		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});

	};

	prompt_resubmit = function() {
		document.body.innerHTML = error_message;
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt); 
                psiTurk.computeBonus('compute_bonus', function(){
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 


			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
	
	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 
            }, 
            error: prompt_resubmit});
	});
    
	
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new StroopExperiment(); } // what you want to do when you are done with instructions
    );
});
