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
	"instructions/instruct-1-pdi.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
//	"instructions/instruct-4.html",
//	"instructions/instruct-5.html",
//	"instructions/instruct-ready.html",
	"instructions/instruct-6.html",
//	"instructions/instruct-7.html",
	"instructions/instruct-8.html",
//	"instructions/instruct-ready2.html",
	"stage.html",
	"getOtherRules.html",
	"getRuleA.html",
	"getRuleB.html",
	"pdiquestionnaire.html",
	"theend.html"
];

psiTurk.preloadPages(pages);

var instructionPages0 = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-1-pdi.html"
	];

var instructionPages1 = [ // add as a list as many pages as you like
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
//	"instructions/instruct-4.html",
//	"instructions/instruct-5.html",
	"instructions/instruct-6.html",
//	"instructions/instruct-ready.html"
	];

var instructionPages2 = [
//	"instructions/instruct-7.html",
	"instructions/instruct-8.html",
//	"instructions/instruct-ready2.html"
	];


/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested 
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and 
* insert them into the document.
*
********************/

function degToRad(degrees) {
	return (degrees/360)*2*Math.PI;
}

// putting the class here just so that autocomplete can reference it
// NOTE!!! num_change_dir is not really used. The values are randomly assigned within the code
// JITTER Also not used at all
// init rot = 1 , looking from top = counterclockwise. Set to 0 for most - randomly assigned at
//       runtime. If != 0 - problematic stimuli, end position important. Do not randomize dir or 
//		 num dir changes.
function stimulus(stim_name, obj_file_name, obj_tex_file_name, obj_mtl_shin, obj_rot_init_ang, obj_rot_max_ang, obj_rot_max_speed, obj_rot_init_dir, obj_good_size, obj_size, obj_center, dots_gr_xyz, dots_onset_degree, dots_g_radius, dots_r_radius, dots_g_radius_big=0.0, dots_r_radius_big=0.0) {
	
	if (obj_rot_max_ang == 0) obj_rot_max_ang = 30;
	if (obj_rot_max_speed == 0) obj_rot_max_speed = 5.0;
	
	this.name = stim_name;
	this.light = 0xffffff;
	this.obj = {
		rot_init_ang: degToRad(obj_rot_init_ang),
		rot_init_dir: obj_rot_init_dir,
		rot_max_speed: degToRad(obj_rot_max_speed), 
		rot_min_speed: degToRad(0.2), 
		rot_max_ang: degToRad(obj_rot_max_ang),
		good_size: obj_good_size,
		distance: 20.0,
		file_name: obj_file_name,
		tex_file_name: obj_tex_file_name,
		mtl_shin: obj_mtl_shin,
		rot_num_change_dir: 3,
		center: obj_center,
		size: obj_size,
		scaling: 1
	};

	this.dots = {
		color_flipped: 0,
		g_pos: [dots_gr_xyz[0], dots_gr_xyz[1], dots_gr_xyz[2]],
		r_pos: [dots_gr_xyz[3], dots_gr_xyz[4], dots_gr_xyz[5]],
		r_radius: dots_r_radius,
		r_radius_big: dots_r_radius_big,
		r_is_big: false,
		r_tex_file_name: 'dotRed.jpg',
		g_radius: dots_g_radius,
		g_radius_big: dots_g_radius_big,
		g_is_big: false,
		g_tex_file_name: 'dotGreen.jpg',
		onset_degree: degToRad(dots_onset_degree), 
		jitter_on: 0,
		jitter_amount: 0.1, 
		g_jitter: 0,
		r_jitter: 0
	};
}




/**********************
* 3D Experiment TEST  *
***********************/
var ThreeDExperiment = function(expPhase) {
    // exp phase either part 1 or part 2
    
	var webGLRenderer = new THREE.WebGLRenderer();
	var listening = false;

    var randStim, catchStimNumber = 0, trialNum = 0, correctCounter = 0, scene, objGroup, stimMesh, redDotMesh, greenDotMesh, redMat, greenMat, camera, num_change_dir, framerate = 10, currStim;
    var response, theta = 0, moving, rotDelta, rotDir, aframe, responseDiv, loaderCircle, loadingDone, redDotCenter, greenDotCenter, respCorrect, reactionTimeStart, reactionTimeEnd;
    
    var lightPos = [], spotLights = [], ambLight;
    
    // debug vars - turn debug features on and off (vertical line through origin, ability to switch camera view, stim randomization, etc)
    var debug_ON = false; camViewFromTop = false;
    
    // number of trials parameters MAKE SURE 2a trials == 2*number of stimuli
	var maxNumTrialsPart1 = 65, corrNumTrialsPart1 = 8, numTrialsPart2a = 32, numTrialsPart2b = 8;

	// create stimuli
	
	// -------------------- PART 1 - ONLY UNAMBIGUOUS STIMULI --------------------------------
	
	// banana viewed from the side with markers on its left and right extremes. 
	var BananaExtremes = new stimulus('BananaExtremes', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 0, 15, 5, [-0.000132, -0.520213, 1.791464], [0.19258, -0.35, -0.01942, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the side with markers on the left and center
	var BananaCenterLeft = new stimulus('BananaCenterLeft', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 0, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the side with markers on the rigth and center
	var BananaCenterRight = new stimulus('BananaCenterRight', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 0, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.19258, -0.35, -0.01942], 25, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the concave side, with makers on center and left, max rotation 20 degrees, should not allow left to end up away from us
	var BananaFlatCenterLeft1 = new stimulus('BananaFlatCenterLeft1', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 40, 7.5, 1, 15, 5, [0.42014, 0.202933, -0.134221], [0.43, 0.2, -0.5290, 1.65, 0.60, 2.1690], 20, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the concave side, with makers on center and right, max rotation 20 degrees, ok when left is away from us
	var BananaFlatCenterRight1 = new stimulus('BananaFlatCenterRight1', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 40, 7.5, 0, 15, 5, [0.42014, 0.202933, -0.134221], [0.51, 0.2, 0.2290, 1.68, 0.7, -2.270], 20.0, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the concave side, with makers on center and left, max rotation 27.5 degrees
	var BananaFlatCenterLeft2 = new stimulus('BananaFlatCenterLeft2', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 55, 7.5, 0, 15, 5, [0.42014, 0.202933, -0.134221], [0.43, 0.2, -0.5290, 1.65, 0.60, 2.1690], 27.5, 0.1, 0.1, 0.12, 0.12);
	
	// banana viewed from the concave side, with makers on center and right, max rotation 27.5 degrees
	var BananaFlatCenterRight2 = new stimulus('BananaFlatCenterRight2', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 55, 7.5, 0, 15, 5, [0.42014, 0.202933, -0.134221], [0.51, 0.2, 0.2290, 1.68, 0.7, -2.270], 27.5, 0.1, 0.1, 0.12, 0.12);
	
	// half apple with markers on left and right extremes.
	var HalfAppleExtremes = new stimulus('HalfAppleExtremes', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5.5, 0, 10, 10, [-2.568784, -0.669885, -3.27716], [1.46237, 0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	// half apple with markers on left and center
	var HalfAppleCenterLeft = new stimulus('HalfAppleCenterLeft', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5.5, 0, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	// half apple with markers on center and right
	var HalfAppleCenterRight = new stimulus('HalfAppleCenterRight', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5.5, 0, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, 1.46237, 0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	// whole apple with markers on center and right.
	var WholeAppleCenterRight = new stimulus('WholeAppleCenterRight', 'apple_18.obj', 'apple_18.jpg', 96, -99, 0, 5, 0, 10, 10, [-2.560498, -2.405302, -1.549059], [0.1038, -1.9658, -5.3794, 1.6837, -1.9658, 0.1910], 15.0, 0.35, 0.35, 0.4, 0.4);
	
	// whole apple with markers on center and left.
	var WholeAppleCenterLeft = new stimulus('WholeAppleCenterLeft', 'apple_18.obj', 'apple_18.jpg', 96, -90, 0, 5, 0, 10, 10, [-2.560498, -2.405302, -1.549059], [1.4038, -1.9658, -3.7794, 0.8737, -1.9658, 1.5910], 15.0, 0.35, 0.35, 0.4, 0.4);
	
	// coconut with markers on left and right extremes. 
	var CoconutShallowExtremes = new stimulus('CoconutShallowExtremes', 'coconut_shallow.obj', 'coconut_4.jpg', 10, -90, 40.0, 5, 0, 10, 3.8, [-1.041337, 0, 0], [-0.535, 0.0, -1.6, -0.53265, 0.0, 1.65748], 20.0, 0.1, 0.1, 0.12, 0.12);
	
	// monkey toy with maker on center and left - left marker a little small
	var MonkeyToyCenterLeft = new stimulus('MonkeyToyCenterLeft', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5.5, 0, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, 4.79006], 22.5, 0.27, 0.27, 0.3, 0.3);

	// monkey toy with maker on center and right - right marker a little small
	var MonkeyToyCenterRight = new stimulus('MonkeyToyCenterRight', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5.5, 0, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, -4.77867], 22.5, 0.27, 0.27, 0.3, 0.3);

	// monkey toy with markers on extremes - - test dot sizes might be a little small - lowest range of size a bit small
	var MonkeyToyExtremes = new stimulus('MonkeyToyExtremes', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5.5, 0, 10, 10.8, [0, 0, 0], [1.50413, -0.7, 4.79006, 1.50413, -0.7, -4.77867], 22.5, 0.27, 0.27, 0.3, 0.3);


	// -------------------- PART 2 - ONLY ILLUSORY STIMULI --------------------------------
	//var BlankFaceHollowEyebrowLEFT = new stimulus('BlankFaceHollowEyebrowLEFT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	//var BlankFaceHollowEyebrowRIGHT = new stimulus('BlankFaceHollowEyebrowRIGHT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	// untextured hollow human face with markers on nose and left cheek bone
	var BlankFaceHollowCenterLeft = new stimulus('BlankFaceHollowCenterLeft', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.53, 1.4367, 2.2068, 0.425], 10.0, 0.1, 0.1);
	
	// untextured hollow human face with markers on nose and right cheek bone
	var BlankFaceHollowCenterRight = new stimulus('BlankFaceHollowCenterRight', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.53, -1.4367, 2.2068, 0.298], 10.0, 0.1, 0.1);
	
	// upside-down untextured hollow human face with markers on nose and right cheek bone (our left)
	var UpsideDownBlankFaceHollowCenterLeft = new stimulus('UpsideDownBlankFaceHollowCenterLeft', 'human_face_ud.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.360507, 0.19454], [-0.1, 2.8, 1.48, 1.4367, 2.8068, 0.28], 10.0, 0.1, 0.1);
	
	// upside-down untextured hollow human face with markers on nose and left cheek bone (our right)
	var UpsideDownBlankFaceHollowCenterRight = new stimulus('UpsideDownBlankFaceHollowCenterRight', 'human_face_ud.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.360507, 0.19454], [-0.1, 2.8, 1.48, -1.4367, 2.8068, 0.375], 10.0, 0.1, 0.1);

	//var HumanFaceHollowEyebrowLEFT = new stimulus('HumanFaceHollowEyebrowLEFT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	//var HumanFaceHollowEyebrowRIGHT = new stimulus('HumanFaceHollowEyebrowRIGHT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	// textured hollow human face with markers on nose and left cheek bone
	var HumanFaceHollowCenterLeft = new stimulus('HumanFaceHollowLEFT', 'human_face_hollow.obj', 'human_face.jpg', 0.5, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, 1.5367, 2.2068, 0.3693], 10.0, 0.1, 0.1);
	
	// textured hollow human face with markers on nose and right cheek bone
	var HumanFaceHollowCenterRight = new stimulus('HumanFaceHollowRIGHT', 'human_face_hollow.obj', 'human_face.jpg', 0.5, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, -1.4367, 2.2068, 0.303], 10.0, 0.1, 0.1);
	
	// upside textured hollow human face with markers on nose and right cheek bone (our left)
	var UpsideDownHumanFaceHollowCenterLeft = new stimulus('UpsideDownHumanFaceHollowCenterLeft', 'human_face_ud.obj', 'human_face.jpg', 0.5, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.360507, 0.19454], [-0.1, 2.8, 1.48, 1.4367, 2.8068, 0.28], 10.0, 0.1, 0.1);
	
	// upside textured hollow human face with markers on nose and left cheek bone (our right)
	var UpsideDownHumanFaceHollowCenterRight = new stimulus('UpsideDownHumanFaceHollowCenterRight', 'human_face_ud.obj', 'human_face.jpg', 0.5, 180, 20.0, 5, 0, 12, 6.64, [0.09701, 2.360507, 0.19454], [-0.1, 2.8, 1.48, -1.4367, 2.8068, 0.375], 10.0, 0.1, 0.1);

	// untextured hollow monkey face with markers on left cheek and right side of snout
	var MonkeyFaceBlankHollowOffSnoutLeft = new stimulus('MonkeyFaceBlankHollowOffSnoutLeft', 'Monkey_Face_Hollow.obj', 'Blank_Monkey.jpg', 15, 180, 17.0, 5, 0, 10, 21.7, [-0.217435, -0.403146, 4.528049], [-3.5, 0.46, 8.471, 8.29647, 4.0, 1.6], 8.5, 0.5, 0.5);
	
	// untextured hollow monkey face with markers on right cheek and left side of snout
	var MonkeyFaceBlankHollowOffSnoutRight = new stimulus('MonkeyFaceBlankHollowOffSnoutRight', 'Monkey_Face_Hollow.obj', 'Blank_Monkey.jpg', 15, 180, 17.0, 5, 0, 10, 21.7, [-0.217435, -0.403146, 4.528049], [4.51, 0.11, 7.96, -08.07972, 5.0, 2.9], 8.5, 0.5, 0.5);
	
	// textured hollow monkey face with markers on left cheek and right side of snout
	var MonkeyFaceHollowOffSnoutLeft = new stimulus('MonkeyFaceHollowOffSnoutLEFT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, 0, 10, 21.7, [-0.217435, -0.403146, 4.528049], [-3.5, 0.46, 8.471, 8.29647, 4.0, 1.6], 8.5, 0.5, 0.5);
	
	// textured hollow monkey face with markers on right cheek and left side of snout
	var MonkeyFaceHollowOffSnoutRight = new stimulus('MonkeyFaceHollowOffSnoutRIGHT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, 0, 10, 21.7, [-0.217435, -0.403146, 4.528049], [4.51, 0.11, 7.96, -8.07972, 5.0, 2.9], 8.5, 0.5, 0.5);
	
	//var MonkeyFaceHollowCenterLeft = new stimulus('MonkeyFaceHollowCenterLeft', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, 8.29647, 4.0, 1.8], 8.5, 0.5, 0.5);
	
	//var MonkeyFaceHollowCenterRight = new stimulus('MonkeyFaceHollowCenterRight', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	//var CastoriaRevPerspLeftWall = new stimulus('CastoriaRevPerspLeftWall', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, 1, 20, 31, [-5.950702, 1.673412, 1.418438], [-3.55, 2.0, -12.64, -8.94, 2.0, -7.20], 15, 0.4, 0.4);
	
	//var CastoriaRevPerspRightWall = new stimulus('CastoriaRevPerspRightWall', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, -1, 20, 31, [-5.950702, 1.673412, 1.418438], [-3.79, 2.0, 15.15, -8.91, 2.0, 9.95], 15, 0.4, 0.4);
	
	// textured reverse perspective castoria. Markers on center building and left street
	var CastoriaRevPersCenterLeftStr = new stimulus('CastoriaRevPersCenterLeftStr', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, 0, 20, 31, [-5.950702, 1.673412, 1.418438], [-5.2918, 0, 0.1146, -9.6484, 0, -5.6206], 15, 0.4, 0.4);
	
	// textured reverse perspective castoria. Markers on center building and right street
	var CastoriaRevPersCenterRightStr = new stimulus('CastoriaRevPersCenterRightStr', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, 0, 20, 31, [-5.950702, 1.673412, 1.418438], [-4.7849, 0, 2.2015, -9.6530, 0, 8.3807], 15, 0.4, 0.4);
	
	// textured hollow ovoid. Markers on left rim and center
	var ConcaveOvoidCenterLeft = new stimulus('ConcaveOvoidCenterLeft', 'ovoid4.obj', 'depth2.jpg', 16, 0, 25.0, 5, 1, 2.25, 1, [0, 0, -0.5], [0, 0, -0.5, -1.8, 0 ,0.55], 10.0, 0.075, 0.075);
	
	// textured hollow ovoid. Markers on right rim and center
	var ConcaveOvoidCenterRight = new stimulus('ConcaveOvoidCenterRight', 'ovoid4.obj', 'depth2.jpg', 16, 0, 25.0, 5, -1, 2.25, 1, [0, 0, -0.5], [0, 0, -0.5, 1.8, 0 ,0.55], 10.0, 0.075, 0.075);
		
	
	// -------------------- PART 3 - CATCH PHASE ONLY UNAMBIGUOUS STIMULI --------------------------------
	
	//var BlankFaceBollowEyebrowLEFT = new stimulus('BlankFaceBollowEyebrowLEFT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	//var BlankFaceBollowEyebrowRIGHT = new stimulus('BlankFaceBollowEyebrowRIGHT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	// untextured bollow human face with markers on nose and left cheekbone
	var BlankHumanFaceBollowCenterLeft = new stimulus('BlankHumanFaceBollowCenterLeft', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, 0, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, -1.6367, 2.2068, -0.1603], 11.0, 0.125, 0.125);

	// untextured bollow human face with markers on nose and right cheekbone
	var BlankHumanFaceBollowCenterRight = new stimulus('BlankHumanFaceBollowCenterRight', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, 0, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, 1.7667, 2.2068, -0.0722], 11.0, 0.125, 0.125);
	
	//var HumanFaceBollowEyebrowLEFT = new stimulus('HumanFaceBollowEyebrowLEFT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	//var HumanFaceBollowEyebrowRIGHT = new stimulus('HumanFaceBollowEyebrowRIGHT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	// textured bollow human face with markers on nose and left cheekbone
	var HumanFaceBollowCenterLeft = new stimulus('HumanFaceBollowCenterLeft', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, 0, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, -1.6367, 2.2068, -0.1603], 11.0, 0.125, 0.125);

	// textured bollow human face with markers on nose and right cheekbone
	var HumanFaceBollowCenterRight = new stimulus('HumanFaceBollowCenterRight', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, 0, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, 1.7667, 2.2068, -0.0722], 11.0, 0.125, 0.125);
	
	//var BlankMonkeyFaceBollowOffSnoutLEFT = new stimulus('BlankMonkeyFaceBollowOffSnoutLEFT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.318, -0.44, 8.075, -9.57972, 5.0, 1.1087], 10.0, 0.4, 0.4);
	
	//var BlankMonkeyFaceBollowOffSnoutRIGHT = new stimulus('BlankMonkeyFaceBollowOffSnoutRIGHT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-2.78, -0.09, 8.823, 8.89647, 4.0, 0.6036], 10.0, 0.4, 0.4);
	
	//var BlankMonkeyFaceBollowLEFT = new stimulus('BlankMonkeyFaceBollowLEFT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11, -9.17972, 5.0, 1.4087], 10.0, 0.4, 0.4);
	
	//var BlankMonkeyFaceBollowRIGHT = new stimulus('BlankMonkeyFaceBollowRIGHT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [1.6625, -1.8, 10.8, 8.29647, 4.0, 1.4036], 10.0, 0.4, 0.4);
	
	//var BlankMonkeyFaceHollowOffSnoutLEFT = new stimulus('BlankMonkeyFaceHollowOffSnoutLEFT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-3.5, 0.46, 8.471, 8.29647, 4.0, 1.6], 8.5, 0.5, 0.5);
	
	//var BlankMonkeyFaceHollowOffSnoutRIGHT = new stimulus('BlankMonkeyFaceHollowOffSnoutRIGHT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.51, 0.11, 7.96, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	//var BlankMonkeyFaceHollowLEFT = new stimulus('BlankMonkeyFaceHollowLEFT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, 8.29647, 4.0, 1.8], 8.5, 0.5, 0.5);
	
	//var BlankMonkeyFaceHollowRIGHT = new stimulus('BlankMonkeyFaceHollowRIGHT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);

	//var MonkeyFaceBlankBollowCenterLeft = new stimulus('MonkeyFaceBlankBollowCenterLeft', 'Monkey_Face_Bollow.obj', 'Blank_Monkey.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11, -9.17972, 5.0, 1.4087], 10.0, 0.4, 0.4);
	
	//var MonkeyFaceBlankBollowCenterRight = new stimulus('MonkeyFaceBlankBollowCenterRight', 'Monkey_Face_Bollow.obj', 'Blank_Monkey.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [1.6625, -1.8, 10.8, 8.29647, 4.0, 1.4036], 10.0, 0.4, 0.4);
	
	//var MonkeyFaceBollowOffSnoutLEFT = new stimulus('MonkeyFaceBollowOffSnoutLEFT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.318, -0.44, 8.075, -9.57972, 5.0, 1.1087], 10.0, 0.4, 0.4);
	
	//var MonkeyFaceBollowOffSnoutRIGHT = new stimulus('MonkeyFaceBollowOffSnoutRIGHT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-2.78, -0.09, 8.823, 8.89647, 4.0, 0.6036], 10.0, 0.4, 0.4);
	
	// textured bollow monkey face with markers on left cheek and left side of snout
	var MonkeyFaceBollowCenterLeft = new stimulus('MonkeyFaceBollowCenterLeft', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 0, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11, -9.17972, 5.0, 1.4087], 10.0, 0.4, 0.4);
	
	// textured bollow monkey face with markers on right cheek and right side of snout
	var MonkeyFaceBollowCenterRight = new stimulus('MonkeyFaceBollowCenterRight', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 0, 12, 21.7, [-0.217435, -0.403146, 4.528049], [1.6625, -1.8, 10.8, 7.4, 4.0, 1.4036], 10.0, 0.4, 0.4);
		
	//var CastoriaProperPerspRightWall = new stimulus('CastoriaProperPerspRightWall', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, 1, 16, 31, [-3.542471, -0.005478, 0.00019], [-0.912, 0.0, -14.87, -6.76, 0.0, -8.99], 15, 0.4, 0.4);
	
	//var CastoriaProperPerspLeftWall = new stimulus('CastoriaProperPerspLeftWall', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, -1, 16, 31, [-3.542471, -0.005478, 0.00019], [-1.11, 0.0, 14.6, -6.5, 0.0, 9.28], 15, 0.4, 0.4);
	
	// textured proper perspective castoria with maerkers on center building and left street
	var CastoriaProperPerspCenterLeftStr = new stimulus('CastoriaProperPerspCenterLeftStr', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, 0, 16, 31, [-3.542471, -0.005478, 0.00019], [-3.6718, -1.0934, 1.4608, -7.6879, -1.0934, 6.9841], 15, 0.4, 0.4);
	
	// textured proper perspective castoria with maerkers on center building and right street
	var CastoriaProperPerspCenterRightStr = new stimulus('CastoriaProperPerspCenterRightStr','castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, 0, 16, 31, [-3.542471, -0.005478, 0.00019], [-3.2602, -1.0934, -1.0608, -7.6862, -1.0934, -7.0838], 15, 0.4, 0.4);

	// potato not working
	//var PotatoLeft = new stimulus('PotatoLeft', 'potato_repaired.obj', 'potato_texture_Original.jpg', 16, 0.0, 20.0, 5, 1, 15, 10, [0, 1.960507, 1.7], [0.3, 2.705, 1.5, 1.6367, 2.7068, 0.453], 10.0, 0.15, 0.09);
	
	//var PotatoRight = new stimulus('PotatoRight', 'potato_repaired.obj', 'potato_texture_Original.jpg', 16, 180.0, 20.0, 5, 1, 15, 10, [0, 1.960507, 1.7], [0.3, 2.705, 1.5, -1.6367, 2.7068, 0.453], 10.0, 0.15, 0.09);
	
	// -----------------------------------------------------------------------------------------------------

	var stimList = [];
	var stimCheck = [];
	if (expPhase == 'part1') {
		// only unambiguous stimuli
		// removing BananaFlatCenterRight1 as it is ambiguous
		//stimList = [BananaExtremes, BananaCenterLeft, BananaCenterRight, BananaFlatCenterLeft1, BananaFlatCenterRight1, BananaFlatCenterLeft2, BananaFlatCenterRight2, HalfAppleExtremes, HalfAppleCenterLeft, HalfAppleCenterRight, WholeAppleCenterLeft, WholeAppleCenterRight, CoconutShallowExtremes, MonkeyToyExtremes, MonkeyToyCenterLeft, MonkeyToyCenterRight];
		stimList = [BananaExtremes, BananaCenterLeft, BananaCenterRight, BananaFlatCenterLeft1, BananaFlatCenterLeft2, BananaFlatCenterRight2, HalfAppleExtremes, HalfAppleCenterLeft, HalfAppleCenterRight, WholeAppleCenterLeft, WholeAppleCenterRight, CoconutShallowExtremes, MonkeyToyExtremes, MonkeyToyCenterLeft, MonkeyToyCenterRight];
		
		// this is a list of all stimuli ---- just so we have it
		//stimList = [BananaExtremes, BananaCenterLeft, BananaCenterRight, BananaFlatCenterLeft1, BananaFlatCenterRight1, BananaFlatCenterLeft2, BananaFlatCenterRight2, HalfAppleExtremes, HalfAppleCenterLeft, HalfAppleCenterRight, WholeAppleCenterLeft, WholeAppleCenterRight, CoconutShallowExtremes, MonkeyToyExtremes, MonkeyToyCenterLeft, MonkeyToyCenterRight, BlankFaceHollowCenterLeft, BlankFaceHollowCenterRight, UpsideDownBlankFaceHollowCenterLeft, UpsideDownBlankFaceHollowCenterRight, HumanFaceHollowCenterLeft, HumanFaceHollowCenterRight, UpsideDownHumanFaceHollowCenterLeft, UpsideDownHumanFaceHollowCenterRight, MonkeyFaceBlankHollowOffSnoutLeft, MonkeyFaceBlankHollowOffSnoutRight, MonkeyFaceHollowOffSnoutLeft, MonkeyFaceHollowOffSnoutRight, CastoriaRevPersCenterLeftStr, CastoriaRevPersCenterRightStr, ConcaveOvoidCenterLeft, ConcaveOvoidCenterRight, BlankHumanFaceBollowCenterLeft, BlankHumanFaceBollowCenterRight, HumanFaceBollowCenterLeft, HumanFaceBollowCenterRight, MonkeyFaceBollowCenterLeft, MonkeyFaceBollowCenterRight, CastoriaProperPerspCenterLeftStr, CastoriaProperPerspCenterRightStr];

	} else if (expPhase == 'part2a') {
		// only illusory stimuli
		stimList = [BlankFaceHollowCenterLeft, BlankFaceHollowCenterRight, UpsideDownBlankFaceHollowCenterLeft, UpsideDownBlankFaceHollowCenterRight, HumanFaceHollowCenterLeft, HumanFaceHollowCenterRight, UpsideDownHumanFaceHollowCenterLeft, UpsideDownHumanFaceHollowCenterRight, MonkeyFaceBlankHollowOffSnoutLeft, MonkeyFaceBlankHollowOffSnoutRight, MonkeyFaceHollowOffSnoutLeft, MonkeyFaceHollowOffSnoutRight, CastoriaRevPersCenterLeftStr, CastoriaRevPersCenterRightStr, ConcaveOvoidCenterLeft, ConcaveOvoidCenterRight];
		//stimCheck = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // --- no idea what this is for
	} else if (expPhase == 'part2b') {
    	// catch phase - only unambiguous stimuli 
		stimList = [BlankHumanFaceBollowCenterLeft, BlankHumanFaceBollowCenterRight, HumanFaceBollowCenterLeft, HumanFaceBollowCenterRight, MonkeyFaceBollowCenterLeft, MonkeyFaceBollowCenterRight, CastoriaProperPerspCenterLeftStr, CastoriaProperPerspCenterRightStr];
	}

    // function where we initialize the general 3D settings
    if (debug_ON) var tempStimNum = 0;
    
    var addLoaderCircle = function () {
        // add loader and make invisible
    	loaderCircle = document.createElement('div');
		loaderCircle.setAttribute("id", "loader");
		loaderCircle.setAttribute("class", "loader");
		//loaderCircle.setAttribute("style","animation: spin 2s linear infinite;");
		document.getElementById("trial").appendChild(loaderCircle);
		loadingDone = false;
    }
    
	var threeDstuff = function() {
        // init vars
        if (expPhase == 'part1') {
        	if (debug_ON) {
        		randStim = tempStimNum;
        		currStim = stimList[randStim];
        		tempStimNum++;
        	} else {
        		randStim = Math.floor(Math.random() * stimList.length);
        		currStim = stimList[randStim];
        	}
        } else if (expPhase == 'part2a') {
        	// make sure stims are not shown more than 2 times
        	do {
        		randStim = Math.floor(Math.random() * stimList.length);
        	} while (stimCheck[randStim] == 2);   
			
			randStim = Math.floor(Math.random() * stimList.length);
			currStim = stimList[randStim];
			
			// keep track of how many times a stim has been shown
			stimCheck[randStim]++;   
		} else if (expPhase == 'part2b') {
			currStim = stimList[catchStimNumber];
			catchStimNumber++;
		}
		

		currStim.obj.scaling = currStim.obj.good_size/currStim.obj.size;
		
		// if rot init dir == 0 - problematic stimuli that can be ambiguous if they end up in
		// certain ending pose, do not randomize. For the rest - randomize
		if (currStim.obj.rot_init_dir == 0) {
			// randomize
 			currStim.obj.rot_num_change_dir = Math.round(Math.random())+2;
 			if (Math.round(Math.random()) == 0) {
 				currStim.obj.rot_init_dir = -1;
 			} else {
 				currStim.obj.rot_init_dir = 1;
 			}
		}
		rotDir = currStim.obj.rot_init_dir;

		theta = 0;
        moving = true;
        num_change_dir = 0; // counter
        
        // create a scene, that will hold all our elements such as objects, cameras and lights.		
        scene = new THREE.Scene();

        // create a camera, which defines where we're looking at.
        // field of view 45, proportions based on window size and near and far clipping planes
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
        
        // position and point the camera to the center of the scene
        camera.position.set(0, 0, currStim.obj.distance);
        //camera.position.set(0, 15, 2); // raise camera so we can see if rotation is about object center
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    
        // create a render and set the size
        webGLRenderer.setClearColor(new THREE.Color(0x000000, 1.0));
        webGLRenderer.setSize(window.innerWidth, window.innerHeight);
        webGLRenderer.shadowMapEnabled = false;
    
        addLights();

        createScene();

        //Render upon resize
        window.addEventListener('resize', function() {
            var Width = window.innerWidth-100, Height = window.innerHeight-100;
            webGLRenderer.setSize(Width, Height);
            camera.aspect = Width / Height;
            camera.updateProjectionMatrix();
        });
      
        render();

        // add DOM element to the page
        document.getElementById("3dstuff").appendChild(webGLRenderer.domElement);
        
        // increment trial num
        trialNum++;
    }

    function animate3D() {
    	// number of times it changed direction less than specified == keep turning
    	if (moving) {
    		// calculate new rotation angle
    		// note that max speed is in terms of rad per second
    		// we need to convert that into radians per frame
    		// same thing for min speed. We never actually want the rotation to stop,
    		// so we add minspeed at all times.
    		// we use cos rather than sin so that when the object is flat in front of us
    		// i.e. theta == 0, it is moving the fastest
    		// we multiply by the initial dir variable to change dir if necessary
    		
    		// calculate new rotation delta
    		rotDelta = (currStim.obj.rot_max_speed/framerate)*Math.cos(theta)*rotDir;
    		
    		// calculations vary depending on direction 
    		// could probably be simplified and the sign disregarded but this requires 
    		// time and caution. This should work for now
    		if (rotDelta >= 0) {
        		// figure out if it is time to draw the probes
        		// if we are on the last rotation and theta > dots_onset_degree 
        		// then draw the probes
        		if (num_change_dir + 1 == currStim.obj.rot_num_change_dir &&
        		 	theta + rotDelta >= currStim.dots.onset_degree) {
        			// make the dots visible
        			redMat.opacity = 1;
        			greenMat.opacity = 1;
    		 	}
    		    
    			// add min speed to delta
    			rotDelta = rotDelta + currStim.obj.rot_min_speed/framerate;
    			
    			// see if we need to flip direction
    			if (theta + rotDelta >= currStim.obj.rot_max_ang) {
    				// if we are on the last rotation this means we should stop
    				if (num_change_dir + 1 == currStim.obj.rot_num_change_dir) {
    					num_change_dir++;
    					theta = currStim.obj.rot_max_ang;
    					moving = false;
    					listening = true;
    					reactionTimeStart = new Date();
    				} else {
    					// changing direction	
    					num_change_dir++;
    					rotDir = -rotDir;
    					theta = theta - rotDelta;
    				}
    			} else {
    				//just update theta
    				theta = theta + rotDelta;
    			}
    		} else {
    			// add min speed to delta
    			rotDelta = rotDelta - currStim.obj.rot_min_speed/framerate;
    			
        		// figure out if it is time to draw the probes
        		// if we are on the last rotation and theta > dots_onset_degree 
        		// then draw the probes
        		if (num_change_dir + 1 == currStim.obj.rot_num_change_dir &&
        		 	theta + rotDelta <= -currStim.dots.onset_degree) {
        			// make the dots visible
        			redMat.opacity = 1;
        			greenMat.opacity = 1;
    		 	}
    			
    			// see if we need to flip direction
    			if (theta + rotDelta < -currStim.obj.rot_max_ang) {
    				// if we are on the last rotation this means we shoudl stop
    				if (num_change_dir + 1 == currStim.obj.rot_num_change_dir) {
    					num_change_dir++;
    					theta = -currStim.obj.rot_max_ang;
    					moving = false;
    					listening = true;
    					reactionTimeStart = new Date();
    				} else {
    					// changing direction	
    					num_change_dir++;
    					rotDir = -rotDir;
    					theta = theta - rotDelta;
    				}
    			} else {
    				//just update theta
    				theta = theta + rotDelta;
    			}
    		}
    	} 
    }

    function createScene() {
        objGroup = new THREE.Group();
        loader = new THREE.OBJLoader();

		// placed the loader in a wrapper function so that rotation doesn't start until the object is loaded. 
		// This can be a problem on computers with slower connection or high cpu load. 
		function createObjects() {

	        loader.load("../static/images/objects/" + currStim.obj.file_name, 
	        	function (object) {
	        		// on load - remove loader circle
	        		document.getElementById("loader").setAttribute("style", "display: none");
	        		
	        		// function to be executed upon obj file successful load
		            object.children.forEach(function(child) {
		                child.geometry.computeFaceNormals();
		                //child.geometry.computeVertexNormals(); // disabled because you see the blocky faces with this on
		
		                child.geometry.center();
		                child.geometry.verticesNeedUpdate = true;
		                
		                child.material.opacity = 0.2;
		            });
		
		            // add texture
		            stimMesh = createMesh(object.children[0].geometry, currStim.obj.tex_file_name);
		            
		            // scale to a good size
					stimMesh.scale.set(currStim.obj.scaling, currStim.obj.scaling, currStim.obj.scaling);
					objGroup.add( stimMesh );
					stimMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
						-currStim.obj.center[0], -currStim.obj.center[1], -currStim.obj.center[2]));
	        	}, 
	        	function (xhr) {
	        		// fn to use during loading
	    			document.getElementById("loader").setAttribute("style", "display: block");

	        		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	        	}, 
	        	function (error) {
	        		// function to handle errors
	        		console.log( 'An error happened: ' + error.message);
	        		
	        		alert('Error Loading 3D Object: ' + error.message);
	        	});

        	return true;
		}
		
		if (createObjects()) {
			scene.add( objGroup );
		}

        // add dots to objGroup before we start transforming the object since that is easier
        // than trying to figure out the transformations to position the dots correctly
        // at a later time
        addDots();
                
        // rotate group - object with dots
		objGroup.rotation.y = currStim.obj.rot_init_ang;
		
		if (debug_ON) {
			// draw line for rotation reference
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
			var lineGeometry = new THREE.Geometry();
			lineGeometry.vertices.push(new THREE.Vector3(0, -100, 0));
			lineGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
			var Line = new THREE.Line(lineGeometry,lineMaterial);
			objGroup.add(Line);
		}
    }

	function wait(ms){
		var start = new Date().getTime();
		var end = start;
		while(end < start + ms) {
	   		end = new Date().getTime();
		}
	}

    function addLights() {
        // add 4 spotlights
        lightPos = [new THREE.Vector3(0, 50, 25),
            new THREE.Vector3(0, -50, 25),
            new THREE.Vector3(-50, 0, 25),
            new THREE.Vector3(50, 0, 25)];

        // add spotlight for the shadows
        spotLights = [];
        for (i=0; i<lightPos.length; i++) {
            spotLights[i] = new THREE.SpotLight(currStim.light);
            spotLights[i].position.set(lightPos[i].x, lightPos[i].y, lightPos[i].z);
            spotLights[i].intensity = 0.5;
            scene.add(spotLights[i]);
        }

        // if necessary add some ambient light
        ambLight = new THREE.AmbientLight(0x999999, 0.05);
        scene.add(ambLight);
    }

	function addDots(){
        // if we have jitter on
        // this probably won't be used at all 
        // if (currStim.dots.jitter_on) {
        // 	currStim.dots.g_jitter = Math.random()*currStim.dots.jitter_amount*currStim.dots.g_radius;
        // 	currStim.dots.r_jitter = Math.random()*currStim.dots.jitter_amount*currStim.dots.r_radius;
        // }
        
        // randomly determine if red or green will be big
        if (Math.round(Math.random())) currStim.dots.r_is_big = true;
        else currStim.dots.r_is_big = false;
        
        // red
        if (currStim.dots.r_radius_big != 0.0 && currStim.dots.r_is_big) var redR = currStim.dots.r_radius_big;
        else var redR = currStim.dots.r_radius;
        
        var redGeo = new THREE.SphereGeometry(redR + currStim.dots.r_jitter, 48, 48);
        var textureR = THREE.ImageUtils.loadTexture("../static/images/objects/" + currStim.dots.r_tex_file_name);
		redMat = new THREE.MeshPhongMaterial({ 
	    	color: 0x999999, 
	    	specular: 0x050505,
	    	shininess: 1,
	    	opacity: 0, transparent: true
    	});
		redMat.map = textureR;
		redDotMesh = new THREE.Mesh(redGeo, redMat);
		
		redDotMesh.scale.set(currStim.obj.scaling, currStim.obj.scaling, currStim.obj.scaling);
		redDotMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
			-currStim.obj.center[0], -currStim.obj.center[1], -currStim.obj.center[2]));
		redDotMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
			currStim.dots.r_pos[0], currStim.dots.r_pos[1], currStim.dots.r_pos[2]));
        objGroup.add(redDotMesh);
        
        // green 
        if (currStim.dots.g_radius_big != 0.0 && !currStim.dots.r_is_big) var greenR = currStim.dots.g_radius_big;
        else var greenR = currStim.dots.g_radius;
        
		var greenGeo = new THREE.SphereGeometry(greenR + currStim.dots.g_jitter, 48, 48);
        var textureG = THREE.ImageUtils.loadTexture("../static/images/objects/" + currStim.dots.g_tex_file_name);
		greenMat = new THREE.MeshPhongMaterial({ 
        	color: 0x999999, 
	    	specular: 0x050505,
	    	shininess: 1,
	    	opacity: 0, transparent: true
    	});
		greenMat.map = textureG;
		greenDotMesh = new THREE.Mesh(greenGeo, greenMat);
		greenDotMesh.scale.set(currStim.obj.scaling, currStim.obj.scaling, currStim.obj.scaling);
		greenDotMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
			-currStim.obj.center[0], -currStim.obj.center[1], -currStim.obj.center[2]));
		greenDotMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
			currStim.dots.g_pos[0], currStim.dots.g_pos[1], currStim.dots.g_pos[2]));
        objGroup.add( greenDotMesh );
        
        //randomize dot colors
        //dotColorFlipped: 0 if same, 1 if dotColorFlipped
        currStim.dots.color_flipped = Math.round(Math.random())
        if (currStim.dots.color_flipped == 1) {
        	redMat.map = textureG;
        	greenMat.map = textureR;
        }
	}

	var storeData = function() {
		// when storing data we should store:
		// - all properties of the currStim class
		// - the reaction time (although not accurate to the ms it still provides info)
		// - the actual response
		// - the actual positions of each sphere in 3D
		// - whether response was correct or not - to figure this out we would need 
		//		the previous 2 anyway
		var redPos, greenPos;
		if (currStim.dots.color_flipped) {
			redPos = currStim.dots.g_pos;
			greenPos = currStim.dots.r_pos;
		} else {
			redPos = currStim.dots.r_pos;
			greenPos = currStim.dots.g_pos;
		}
		
		psiTurk.recordTrialData({'phase':expPhase, 
			'trial':trialNum,
			'stim_name':currStim.name, 
			'stim_light_color':currStim.light,
			'stim_rot_init_ang':currStim.obj.rot_init_ang, 
			'stim_rot_init_dir':currStim.obj.rot_init_dir, 
			'stim_rot_max_speed':currStim.obj.rot_max_speed,
			'stim_rot_min_speed':currStim.obj.rot_min_speed,
			'stim_rot_max_ang':currStim.obj.rot_max_ang,
			'stim_good_size':currStim.obj.good_size,
			'stim_distance':currStim.obj.distance,
			'stim_file_name':currStim.obj.file_name,
			'stim_tex_file_name':currStim.obj.tex_file_name,
			'stim_mtl_shin':currStim.obj.mtl_shin,
			'stim_rot_num_change_dir':currStim.obj.rot_num_change_dir,
			'stim_center':currStim.obj.center,
			'stim_size':currStim.obj.size,
			'stim_scaling':currStim.obj.scaling,
			'dots_green_pos':greenPos,
			'dots_red_pos':redPos,
			'dots_color_flipped':currStim.dots.color_flipped,
			'dots_green_radius':currStim.dots.g_radius,
			'dots_red_radius':currStim.dots.r_radius,
			'dots_green_radius_big':currStim.dots.g_radius_big,
			'dots_red_radius_big':currStim.dots.r_radius_big,
			'dots_red_is_big':currStim.dots.r_is_big,
			'dots_jitter_on':currStim.dots.jitter_on,
			'dots_green_jitter':currStim.dots.g_jitter,
			'dots_red_jitter':currStim.dots.r_jitter,
			'dots_onset_degree':currStim.dots.onset_degree,
			'resp_given':response,
			'resp_correct':respCorrect,
			'resp_reaction_time':reactionTimeEnd.getTime()-reactionTimeStart.getTime()
		});

		psiTurk.saveData();
	}

	var next = function() {
		// remove textual confirmation
		if (expPhase == 'part1') document.getElementById("3dstuff").removeChild(responseDiv);
		
	    // remove old dom element 
	    document.getElementById("3dstuff").removeChild(webGLRenderer.domElement); 
	    if (expPhase == 'part1') {
			if (trialNum == maxNumTrialsPart1) {
				getTheRule('B');
			}
			else if (correctCounter == corrNumTrialsPart1) {
				getTheRule('A');
			}
			else {
				threeDstuff();
			}
	    } else if (expPhase == 'part2a') {
	    	if (trialNum == numTrialsPart2a) {
	    		ThreeDExperiment('part2b');
	    	} else {
	    		threeDstuff();
	    	}
	    } else if (expPhase == 'part2b') {
	    	if (trialNum == numTrialsPart2b) {
	    		finishExp();
	    	} else {
	    		threeDstuff();
	    	}
	    }
	};
	
	var response_handler = function(e) {
		if (!listening) return;

		var keyCode = e.keyCode;

		switch (keyCode) {
			case 82:
				// "R"
				response="red";
				break;
			case 71:
				// "G"
				response="green";
				break;
			case 67:
				if (debug_ON) {
				 	if (camViewFromTop) 
				 		camera.position.set(0, 0, currStim.obj.distance);
				 	else 
	        			camera.position.set(0, 15, 2); // raise camera so we can see if rotation is about object center
	        		camera.lookAt(new THREE.Vector3(0, 0, 0));
	        		camera.updateProjectionMatrix();
	        		render();
	        		camViewFromTop = !camViewFromTop;
				}
        		response = "";
        		break;
			default:
				response = "";
				break;
		}
		if (response.length>0) {
			listening = false;
			reactionTimeEnd = new Date();
			feedback();
			storeData();
		}
	};

   function createMesh(geom, imageFile) {
        var texture = THREE.ImageUtils.loadTexture("../static/images/objects/" + imageFile)
        var mat = new THREE.MeshPhongMaterial({ 
		    color: 0x999999, 
		    specular: 0x050505,
		    shininess: currStim.obj.mtl_shin
		});
        mat.map = texture;
        var mesh = new THREE.Mesh(geom, mat);
        return mesh;
    }
    
    function getCenterInWorldCoord(mesh) {
        var middle = new THREE.Vector3();
        var geometry = mesh.geometry;
        
        geometry.computeBoundingBox();

        middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
        middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
        middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;
    
        mesh.localToWorld( middle );
        return middle;
    }

    function render() {
		animate3D();
		
		if (moving) {
			// perform the actual rotations
    		objGroup.rotation.y = currStim.obj.rot_init_ang + theta;
    		
            // render using requestAnimationFrame
            aframe = requestAnimationFrame(render);
		}
		
		webGLRenderer.render(scene, camera);
    };
        
	var feedback = function() {
    	respCorrect = false;
	    // figure out if response was correct
	    //use dotColorFlipped variable to determine the color/position relationship
	    if (currStim.dots.color_flipped == 0) {
			redDotCenter = getCenterInWorldCoord(redDotMesh);
			greenDotCenter = getCenterInWorldCoord(greenDotMesh);

	    } else {
	    	redDotCenter = getCenterInWorldCoord(greenDotMesh);
	    	greenDotCenter = getCenterInWorldCoord(redDotMesh);
	    }
	    
	    if (response == 'red') {
	        if (redDotCenter.z > greenDotCenter.z) respCorrect = true;
	    } else if (response == 'green') {
	        if (redDotCenter.z < greenDotCenter.z) respCorrect = true;
	    }
	    
	    if (respCorrect) {
	    	if (expPhase == 'part1') {
		        correctAudio.play();
		        textC();
	    	}
	        correctCounter++;
	    } else {
	    	if (expPhase == 'part1') {
	            incorrectAudio.play();
		        textI();
	    	}
	        correctCounter = 0;
	    }
	   
		if (expPhase == 'part1') setTimeout(next,2000);
		else setTimeout(next,500);
	};
	
	var textC = function() {
	    responseDiv = document.createElement('div');
	    var responseImg = document.createElement("img");
	    responseImg.setAttribute("src","../static/images/thumbsUp.png");
	    responseImg.setAttribute("height", "100")
	    responseImg.setAttribute("width","50")
	    responseDiv.style.position = 'absolute';
	    responseDiv.style.top = window.innerHeight*0.75 + 'px';
	    responseDiv.style.left = window.innerWidth/2 + 'px';
	    responseDiv.appendChild(responseImg);
	    document.getElementById("3dstuff").appendChild(responseDiv);
	}
	
	var textI = function() {
	     responseDiv = document.createElement('div');
	    var responseImg = document.createElement("img");
	    responseImg.setAttribute("src","../static/images/thumbsDown.png");
	    responseImg.setAttribute("height", "100")
	    responseImg.setAttribute("width","50")
	    responseDiv.style.position = 'absolute';
	    responseDiv.style.top = window.innerHeight*0.75 + 'px';
	    responseDiv.style.left = window.innerWidth/2 + 'px';
	    responseDiv.appendChild(responseImg);
	    document.getElementById("3dstuff").appendChild(responseDiv);
	}
	
	var getTheRule = function(ruleCond) {
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new TheRule(ruleCond);
	};
	
	var finishExp = function() {
	    // finalize the HIT and so on
	    $("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new TheEnd();
	}
	
	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');

	// Register the response handler that is defined above to handle any
	// key down events.
	$("body").focus().keydown(response_handler); 
	
	var correctAudio = document.createElement("AUDIO");
    correctAudio.setAttribute("src","../static/sounds/success.wav");
    document.getElementById("3dstuff").appendChild(correctAudio);
    var incorrectAudio = document.createElement("AUDIO");
    incorrectAudio.setAttribute("src","../static/sounds/error.wav");
    document.getElementById("3dstuff").appendChild(incorrectAudio);

	addLoaderCircle();

    // start trial
    threeDstuff();
};


/****************
* TheRule *
****************/
var TheRule = function(ruleCond) {
    // ruleCond 
    // == A: correctCounter == 8 - someone got 8 consecutive correct answers
    // == B: trialNum == 10

	record_responses = function() {
		// store uid so we can later figure out who this data belongs to
		psiTurk.recordUnstructuredData('uniqueid', uniqueId);
		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		
		psiTurk.recordTrialData({'phase':'therule', 'status':'submit'});
	};

	// Load the questionnaire snippet 
	if (ruleCond == 'A') {
	    psiTurk.showPage('getRuleA.html');
	} else {
	    psiTurk.showPage('getRuleB.html');
	}
	psiTurk.recordTrialData({'phase':'therule', 'status':'begin'});

	// next click handling function
	$("#next").click(function () {
		var ruleText = document.getElementById("rule_desc").value;
		ruleText = ruleText.trim();
		if (ruleText.length > 0) {
	    record_responses();
	    psiTurk.saveData();
	    currentview = new OtherRules();
		}
		if (ruleText.length == 0) {
			document.getElementById("requiredText").style.color = "red";
		}
	});
};


/****************
* OtherRules *
****************/
var OtherRules = function() {
	record_responses = function() {
		// store uid so we can later figure out who this data belongs to
		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});

		psiTurk.recordTrialData({'phase':'otherrules', 'status':'submit'});
	};

	psiTurk.recordTrialData({'phase':'otherrules','status':'begin'});
   	psiTurk.showPage('getOtherRules.html');

   	$("#next").click(function () {
   		var otherRuleText = document.getElementById("other_rules_desc").value;
   		otherRuleText = otherRuleText.trim();
		if (otherRuleText.length > 0) {
			record_responses();
			psiTurk.saveData();
			psiTurk.doInstructions(
	        	instructionPages2, // a list of pages you want to display in sequence
	        	function() { currentview = new ThreeDExperiment('part2a'); } // what you want to do when you are done with instructions
	    	);
		}
   		else {
   			document.getElementById("otherRequiredText").style.color = "red";
   		}
   		
   	});
};

/****************
* Questionnaire *
****************/
var Questionnaire = function() {
	
	var q = ["Do you ever feel as if people seem to drop hints about you or say things with a double meaning?", 
		"Do you ever feel as if things in magazines or on TV were written especially for you?",
		"Do you ever feel as if some people are not what they seem to be?", 
		"Do you ever feel as if you are being persecuted in some way?", 
		"Do you ever feel as if there is a conspiracy against you?", 
		"Do you ever feel as if you are, or destined to be someone very important?", 
		"Do you ever feel that you are a very special or unusual person?", 
		"Do you ever feel that you are especially close to God?", 
		"Do you ever think people can communicate telepathically?", 
		"Do you ever feel as if electrical devices such as computers can influence the way you think?", 
		"Do you ever feel as if you have been chosen by God in some way?",
		"Do you believe in the power of witchcraft, voodoo or the occult?", 
		"Are you often worried that your partner may be unfaithful?", 
		"Do you ever feel that you have sinned more than the average person?", 
		"Do you ever feel that people look at you oddly because of your appearance?", 
		"Do you ever feel as if you had no thoughts in your head at all?", 
		"Do you ever feel as if the world is about to end?", 
		"Do your thoughts ever feel alien to you in some way?", 
		"Have your thoughts ever been so vivid that you were worried other people would hear them?", 
		"Do you ever feel as if your own thoughts were being echoed back to you?", 
		"Do you ever feel as if you are a robot or zombie without a will of yourown?"];
	var q_opt =["dist", "think", "believe"];
	
	// array to keep track of which questions have the optional questions displayed so we don't add them more than once
	var q_opt_shown = new Array(q.length);
	for (var u=0; u<q.length; u++) q_opt_shown[u] = 0;	//init to 0
	
	var next = function() {
		psiTurk.doInstructions(
        	instructionPages1, // a list of pages you want to display in sequence
        	function() { currentview = new ThreeDExperiment('part1'); } // what you want to do when you are done with instructions
    	);
	};
	
	var show_next = function() {
		d3.select("#button_container")
			.append("button")
			.attr("id","next")
			.attr("value","next")
			.attr("class","btn btn-primary btn-lg continue")
			.attr("style","text-align:right;")
			.html("Continue <span class='glyphicon glyphicon-arrow-right'></span>")
			.on("click", process_data);
	}
	
	var remove_next = function() {
		d3.select("#next").remove();
	}
	
	var process_data = function() {
		var q_objs = [];
		var q_ans = [];
		var curr_q_ans = [];
		
		// loop through all questions
		for (var g=0; g<q.length; g++) {
			// init array
			curr_q_ans = [];
			
			q_objs[0] = document.getElementsByName("answer" + g);
			
			for (var i=0; i<q_objs[0].length; i++) {
				if (q_objs[0][i].checked) curr_q_ans = q_objs[0][i].value;
			}
				
			if (curr_q_ans.length == 0) {
				alert("Please answer question " + eval(g+1) + " and try again.");
				return;
			}
			
			if (curr_q_ans == "yes") {
				curr_q_ans = [1, 0, 0, 0];
				
				// answer is  yes - validate optional questions too
				// loop through the optional questions
				for (var z=0; z<q_opt.length; z++) {
					q_objs[z+1] = document.getElementsByName(q_opt[z] + g);
				
					for (var i=0; i<q_objs[z+1].length; i++) {
						if (q_objs[z+1][i].checked) curr_q_ans[z+1] = parseInt(q_objs[z+1][i].value);
					}
					
					if (curr_q_ans[z+1].length == 0) {
						alert("Please answer the additional questions on row " + eval(z+1) + " for question " + eval(g+1) + " and try again.");
						return;
					}
				}
				q_ans[g] = curr_q_ans;
			} else {
				// answer is no - store blanks
				q_ans[g] = [0, 0, 0, 0];
			} 
		}
		
		// store data 
		var tmpData = {};
		tmpData['phase'] = "pdi";
		for (var uu=0; uu<q_ans.length; uu++) {
			tmpData['pdi_q_' + eval(uu+1)] = q_ans[uu];
		}
		psiTurk.recordTrialData(tmpData);
		psiTurk.saveData();

		next();
	}
	
	var display_questions = function() {
		for (var h=0; h<q.length; h++) {
			add_q(h);
			//add_optional(h);
		}
	}
	
	var add_q = function(q_num) {
		// add container
		if (q_num > 0) {
			d3.select("#pagebody")
				.append("hr");
		}
		
		d3.select("#pagebody")
			.append("div")
			.attr("id","q" + q_num)
			.attr("style", "display:flex;")
			.html("<table width='300' border='0' cellpadding='5' style='text-align: left; float: left; clear: right; margin-right: 50px;'> \
  <tr> \
    <td colspan='2'>" + eval(q_num+1) + " - " + q[q_num] + "</td> \
  </tr> \
  <tr align='center'> \
    <td><label for='answer" + q_num + "no' id='answer" + q_num + "no-label'>NO</label><br /> \
    <input type='radio' name='answer" + q_num + "' id='answer" + q_num + "no' value='no' /></td> \
    <td><label for='answer" + q_num + "yes' id='answer" + q_num + "yes-label'>YES</label><br /> \
    <input type='radio' name='answer" + q_num + "' id='answer" + q_num + "yes' value='yes' /></td> \
  </tr> \
</table>");
		d3.select("#answer" + q_num + "no")
			.on("click", function () { optional_field(q_num); });
		d3.select("#answer" + q_num + "yes")
			.on("click", function () { optional_field(q_num); });
	}
	 
	var add_optional = function(q_num) {
		if (q_opt_shown[q_num] == 0) {
			// add container
			d3.select("#q" + q_num)
				.append("div")
				.attr("id","opt" + q_num)
				.attr("display", "none")
				.html("<table width='550' border='0' cellpadding='5'>\
	  <tr align=center>\
	    <td width=100>Not at all distressing</td>\
	    <td width=100>&nbsp;</td>\
	    <td width=100>&nbsp;</td>\
	    <td width=100>&nbsp;</td>\
	    <td width=100>Very distressing</td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100 bgcolor=#aaaaaa><label for='dist1" + q_num + "' id='dist1" + q_num + "-label'>1</label><br />\
	    <input type='radio' name='dist" + q_num + "' id='dist1" + q_num + "' value='1' /></td>\
	    <td bgcolor=#aaaaaa><label for='dist2" + q_num + "' id='dist2" + q_num + "-label'>2</label><br />\
	    <input type='radio' name='dist" + q_num + "' id='dist2" + q_num + "' value='2' /></td>\
	    <td bgcolor=#aaaaaa><label for='dist3" + q_num + "' id='dist3" + q_num + "-label'>3</label><br />\
	    <input type='radio' name='dist" + q_num + "' id='dist3" + q_num + "' value='3' /></td>\
	    <td bgcolor=#aaaaaa><label for='dist4" + q_num + "' id='dist4" + q_num + "-label'>4</label><br />\
	    <input type='radio' name='dist" + q_num + "' id='dist4" + q_num + "' value='4' /></td>\
	    <td width=100 bgcolor=#aaaaaa><label for='dist5" + q_num + "' id='dist5" + q_num + "-label'>5</label><br />\
	    <input type='radio' name='dist" + q_num + "' id='dist5" + q_num + "' value='5' /></td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td width=100>&nbsp;</td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100>Hardly ever think about it</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td width=100>Think about it all the time</td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100 bgcolor=#aaaaaa><label for='think1" + q_num + "' id='think1" + q_num + "-label'>1</label><br />\
	    <input type='radio' name='think" + q_num + "' id='think1" + q_num + "' value='1' /></td>\
	    <td bgcolor=#aaaaaa><label for='think2" + q_num + "' id='think2" + q_num + "-label'>2</label><br />\
	    <input type='radio' name='think" + q_num + "' id='think2" + q_num + "' value='2' /></td>\
	    <td bgcolor=#aaaaaa><label for='think3" + q_num + "' id='think3" + q_num + "-label'>3</label><br />\
	    <input type='radio' name='think" + q_num + "' id='think3" + q_num + "' value='3' /></td>\
	    <td bgcolor=#aaaaaa><label for='think4" + q_num + "' id='think4" + q_num + "-label'>4</label><br />\
	    <input type='radio' name='think" + q_num + "' id='think4" + q_num + "' value='4' /></td>\
	    <td width=100 bgcolor=#aaaaaa><label for='think5" + q_num + "' id='think5" + q_num + "-label'>5</label><br />\
	    <input type='radio' name='think" + q_num + "' id='think5" + q_num + "' value='5' /></td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td width=100>&nbsp;</td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100>Don't believe it is true</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td>&nbsp;</td>\
	    <td width=100>Believe it is absolutely true</td>\
	  </tr>\
	  <tr align=center>\
	    <td width=100 bgcolor=#aaaaaa><label for='believe1" + q_num + "' id='believe1" + q_num + "-label'>1</label><br />\
	    <input type='radio' name='believe" + q_num + "' id='believe1" + q_num + "' value='1' /></td>\
	    <td bgcolor=#aaaaaa><label for='believe2" + q_num + "' id='believe2" + q_num + "-label'>2</label><br />\
	    <input type='radio' name='believe" + q_num + "' id='believe2" + q_num + "' value='2' /></td>\
	    <td bgcolor=#aaaaaa><label for='believe3" + q_num + "' id='believe3" + q_num + "-label'>3</label><br />\
	    <input type='radio' name='believe" + q_num + "' id='believe3" + q_num + "' value='3' /></td>\
	    <td bgcolor=#aaaaaa><label for='believe4" + q_num + "' id='believe4" + q_num + "-label'>4</label><br />\
	    <input type='radio' name='believe" + q_num + "' id='believe4" + q_num + "' value='4' /></td>\
	    <td width=100 bgcolor=#aaaaaa><label for='believe5" + q_num + "' id='believe5" + q_num + "-label'>5</label><br />\
	    <input type='radio' name='believe" + q_num + "' id='believe5" + q_num + "' value='5' /></td>\
	  </tr>\
	</table>");
	
			q_opt_shown[q_num] = 1;
		}
	};		

	var remove_q = function(q_num) {
		d3.select("#q" + q_num).remove();
	};
	
	var remove_opt = function(q_num) {
		d3.select("#opt" + q_num).remove();
		q_opt_shown[q_num] = 0;
	};
	
	var optional_field = function (q_num) {
	    var cur_val = document.getElementById("answer" + q_num + "yes");

	    // if currently checked - add field
	    if (cur_val.checked) {
    	    add_optional(q_num);
	    } else {
    	    remove_opt(q_num);
	    }
	};
	
	//psiTurk.recordTrialData({'phase':'pdiquestionnaire','status':'begin'});
   	psiTurk.showPage('pdiquestionnaire.html');

	display_questions();
	show_next();
};

/****************
* THE END *
****************/

var TheEnd = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

// 	record_responses = function() {

// 		psiTurk.recordTrialData({'phase':'therule', 'status':'submit'});

// 		$('textarea').each( function(i, val) {
// 			psiTurk.recordUnstructuredData(this.id, this.value);
// 		});

// 	};

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
			    // bonus not needed and also causes it to crash
                //psiTurk.computeBonus('compute_bonus', function(){
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                //}); 


			}, 
			error: prompt_resubmit
		});
	};

	// Load the questionnaire snippet 
	psiTurk.showPage('theend.html');
// 	psiTurk.recordTrialData({'phase':'therule', 'status':'begin'});
	
	$("#next").click(function () {
	   // record_responses();
	    psiTurk.saveData({
            success: function(){
            	// bonus not needed and also causes it to crash
                //psiTurk.computeBonus('compute_bonus', function() { 
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                //}); 
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
    	instructionPages0, // a list of pages you want to display in sequence
    	//function() { currentview = new ThreeDExperiment('part1'); } // what you want to do when you are done with instructions
    	function() { currentview = new Questionnaire(); } // what you want to do when you are done with instructions
    );
});
