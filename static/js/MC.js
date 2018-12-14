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
	"instructions/instruct-4.html",
	"instructions/instruct-5.html",
	"instructions/instruct-ready.html",
	"instructions/instruct-6.html",
	"instructions/instruct-7.html",
	"instructions/instruct-8.html",
	"instructions/instruct-ready2.html",
	"stage.html",
	"getOtherRules.html",
	"getRuleA.html",
	"getRuleB.html",
	"theend.html"
];

psiTurk.preloadPages(pages);

var instructionPages = [ // add as a list as many pages as you like
	"instructions/instruct-1.html",
	"instructions/instruct-2.html",
	"instructions/instruct-3.html",
	"instructions/instruct-4.html",
	"instructions/instruct-5.html",
	"instructions/instruct-6.html",
	"instructions/instruct-ready.html"
];

var instructionPages2 = [
	"instructions/instruct-7.html",
	"instructions/instruct-8.html",
	"instructions/instruct-ready2.html"
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
function stimulus(stim_name, obj_file_name, obj_tex_file_name, obj_mtl_shin, obj_rot_init_ang, obj_rot_max_ang, obj_rot_max_speed, obj_rot_init_dir, obj_good_size, obj_size, obj_center, dots_gr_xyz, dots_onset_degree, dots_g_radius, dots_r_radius, dots_g_radius_big=0.0, dots_r_radius_big=0.0) {
	
	if (obj_rot_max_ang == 0) obj_rot_max_ang = 30;
	if (obj_rot_max_speed == 0) obj_rot_max_speed = 2.0;
	
	this.name = stim_name;
	this.light = 0xffffff;
	this.obj = {
		rot_init_ang: degToRad(obj_rot_init_ang),
		rot_init_dir: obj_rot_init_dir,
		rot_max_speed: degToRad(obj_rot_max_speed), 
		//rot_max_speed: degToRad(5),  // hard coding it to go faster during debug
		rot_min_speed: degToRad(0.2), 
		rot_max_ang: degToRad(obj_rot_max_ang),
		good_size: obj_good_size,
		distance: 20.0,
		file_name: obj_file_name,
		tex_file_name: obj_tex_file_name,
		mtl_shin: obj_mtl_shin,
		rot_num_change_dir: 2,
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


//monte carlo vars
	var frontDot, backDot, leftDot, rightDot, mcRedCloser = 0, mcGreenCloser = 0, mcGreenLarge = 0, mcRedLarge = 0, mcRedBigClose = 0, mcRedBigFar = 0, mcGreenBigClose = 0, mcGreenBigFar = 0, mcFlipped = 0;

/**********************
* 3D Experiment TEST  *
***********************/
var ThreeDExperiment = function(expPhase) {
    // exp phase either part 1 or part 2
    
	var webGLRenderer = new THREE.WebGLRenderer();
	var listening = false;

    var trialNum = 0, correctCounter = 0, scene, objGroup, stimMesh, redDotMesh, greenDotMesh, redMat, greenMat, camera, num_change_dir, framerate = 10, currStim;
    var response, theta = 0, moving, rotDelta, rotDir, aframe, responseDiv, redDotCenter, greenDotCenter, respCorrect, reactionTimeStart, reactionTimeEnd;
    
    var lightPos = [], spotLights = [], ambLight;
    
    // number of trials parameters
	var maxNumTrialsPart1 = 1000, corrNumTrialsPart1 = 8, numTrialsPart2a = 20, numTrialsPart2b = 10;

	// create stimuli
	var BananaExtremesLEFT = new stimulus('BananaExtremesLEFT', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.19258, -0.35, -0.01942, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.12, 0.12);
	
	var BananaExtremesRIGHT = new stimulus('BananaExtremesRIGHT', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.19258, -0.35, -0.01942, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.12, 0.12);
	
	var BananaLEFT = new stimulus('BananaLEFT', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.12, 0.12);
	
	var BananaCENTER1 = new stimulus('BananaCENTER1', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, -1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.31166, -0.35, 4.14541], 25, 0.1, 0.1, 0.115, 0.115);
	
	var BananaCENTER2 = new stimulus('BananaCENTER2', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, 1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.19258, -0.35, -0.01942], 25, 0.1, 0.1, 0.115, 0.115);
	
	var BananaRIGHT = new stimulus('BananaRIGHT', 'banana8.obj', 'banana8.jpg', 1, -90, 50, 7.5, -1, 15, 5, [-0.000132, -0.520213, 1.791464], [0.4144, -1.4719, 1.9175, 0.19258, -0.35, -0.01942], 25, 0.1, 0.1, 0.12, 0.12);
	
	var BananaFlatLEFT = new stimulus('BananaFlatLEFT', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 40, 7.5, 1, 15, 5, [0.42014, 0.202933, -0.134221], [0.43, 0.2, -0.5290, 1.65, 0.60, 2.1690], 20, 0.1, 0.1, 0.12, 012);
	
	var BananaFlatCENTER1 = new stimulus('BananaFlatCENTER1', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 55, 7.5, -1, 15, 5, [0.42014, 0.202933, -0.134221], [0.43, 0.2, -0.5290, 1.65, 0.60, 2.1690], 27.5, 0.1, 0.1, 0.12, 0.12);
	
	var BananaFlatCENTER2 = new stimulus('BananaFlatCENTER2', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 55, 7.5, 1, 15, 5, [0.42014, 0.202933, -0.134221], [0.51, 0.2, 0.2290, 1.68, 0.7, -2.270], 27.5, 0.1, 0.1, 0.12, 0.12);
	
	var BananaFlatRIGHT = new stimulus('BananaFlatRIGHT', 'banana11_rotated.obj', 'banana11_rotated.jpg', 1, -90, 40, 7.5, -1, 15, 5, [0.42014, 0.202933, -0.134221], [0.51, 0.2, 0.2290, 1.68, 0.7, -2.270], 20.0, 0.1, 0.1, 0.12, 0.12);
	
	var BlankFaceBollowEyebrowLEFT = new stimulus('BlankFaceBollowEyebrowLEFT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	var BlankFaceBollowEyebrowRIGHT = new stimulus('BlankFaceBollowEyebrowRIGHT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	var BlankFaceBollowLEFT = new stimulus('BlankFaceBollowLEFT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.401, -1.7367, 2.2068, -0.1603], 11.0, 0.1, 0.1);

	var BlankFaceBollowRIGHT = new stimulus('BlankFaceBollowRIGHT', 'human_face_bollow.obj', 'blank_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, 1.7667, 2.2068, -0.0722], 11.0, 0.1, 0.1);
	
	var BlankFaceHollowEyebrowLEFT = new stimulus('BlankFaceHollowEyebrowLEFT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	var BlankFaceHollowEyebrowRIGHT = new stimulus('BlankFaceHollowEyebrowRIGHT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	var BlankFaceHollowLEFT = new stimulus('BlankFaceHollowLEFT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, 1.5367, 2.2068, 0.3693], 10.0, 0.1, 0.1);
	
	var BlankFaceHollowRIGHT = new stimulus('BlankFaceHollowRIGHT', 'human_face_hollow.obj', 'blank_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, -1.4367, 2.2068, 0.303], 10.0, 0.1, 0.1);
	
	var BlankMonkeyFaceBollowOffSnoutLEFT = new stimulus('BlankMonkeyFaceBollowOffSnoutLEFT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.318, -0.44, 8.075, -9.57972, 5.0, 1.1087], 10.0, 0.4, 0.4);
	
	var BlankMonkeyFaceBollowOffSnoutRIGHT = new stimulus('BlankMonkeyFaceBollowOffSnoutRIGHT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-2.78, -0.09, 8.823, 8.89647, 4.0, 0.6036], 10.0, 0.4, 0.4);
	
	var BlankMonkeyFaceBollowLEFT = new stimulus('BlankMonkeyFaceBollowLEFT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11, -9.17972, 5.0, 1.4087], 10.0, 0.4, 0.4);
	
	var BlankMonkeyFaceBollowRIGHT = new stimulus('BlankMonkeyFaceBollowRIGHT', 'Monkey_Face_Bollow.obj', 'blank_face.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [1.6625, -1.8, 10.8, 8.29647, 4.0, 1.4036], 10.0, 0.4, 0.4);
	
	var BlankMonkeyFaceHollowOffSnoutLEFT = new stimulus('BlankMonkeyFaceHollowOffSnoutLEFT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-3.5, 0.46, 8.471, 8.29647, 4.0, 1.6], 8.5, 0.5, 0.5);
	
	var BlankMonkeyFaceHollowOffSnoutRIGHT = new stimulus('BlankMonkeyFaceHollowOffSnoutRIGHT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.51, 0.11, 7.96, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	var BlankMonkeyFaceHollowLEFT = new stimulus('BlankMonkeyFaceHollowLEFT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, 8.29647, 4.0, 1.8], 8.5, 0.5, 0.5);
	
	var BlankMonkeyFaceHollowRIGHT = new stimulus('BlankMonkeyFaceHollowRIGHT', 'Monkey_Face_Hollow.obj', 'blank_face.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	var CastoriaBollowLeftWall = new stimulus('CastoriaBollowLeftWall', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, 1, 20, 31, [-5.950702, 1.673412, 1.418438], [-3.55, 2.0, -12.64, -8.94, 2.0, -7.20], 15, 0.4, 0.4);
	
	var CastoriaBollowRightWall = new stimulus('CastoriaBollowRightWall', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, -1, 20, 31, [-5.950702, 1.673412, 1.418438], [-3.79, 2.0, 15.15, -8.91, 2.0, 9.95], 15, 0.4, 0.4);
	
	var CastoriaBollowLEFT = new stimulus('CastoriaBollowLEFT', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, 1, 20, 31, [-5.950702, 1.673412, 1.418438], [-5.2918, 0, 0.1146, -9.6484, 0, -5.6206], 15, 0.4, 0.4);
	
	var CastoriaBollowRIGHT = new stimulus('CastoriaBollowRIGHT', 'castoria_bollow.obj', 'castoria_2.jpg', 1, 90, 15, 2.5, -1, 20, 31, [-5.950702, 1.673412, 1.418438], [-4.7849, 0, 2.2015, -9.6530, 0, 8.3807], 15, 0.4, 0.4);
	
	var CastoriaHollowRightWall = new stimulus('CastoriaHollowRightWall', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, 1, 16, 31, [-3.542471, -0.005478, 0.00019], [-0.912, 0.0, -14.87, -6.76, 0.0, -8.99], 15, 0.4, 0.4);
	
	var CastoriaHollowLeftWall = new stimulus('CastoriaHollowLeftWall', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, -1, 16, 31, [-3.542471, -0.005478, 0.00019], [-1.11, 0.0, 14.6, -6.5, 0.0, 9.28], 15, 0.4, 0.4);
	
	var CastoriaHollowLEFT = new stimulus('CastoriaHollowLEFT', 'castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, 1, 16, 31, [-3.542471, -0.005478, 0.00019], [-3.6718, -1.0934, 1.4608, -7.6879, -1.0934, 6.9841], 15, 0.4, 0.4);
	
	var CastoriaHollowRIGHT = new stimulus('CastoriaHollowRIGHT','castoria_hollow.obj', 'castoria_2.jpg', 1, -90, 15, 2.5, -1, 16, 31, [-3.542471, -0.005478, 0.00019], [-3.2602, -1.0934, -1.0608, -7.6862, -1.0934, -7.0838], 15, 0.4, 0.4);
	
	var CoconutShallowLEFT = new stimulus('CastoriaHollowRIGHT', 'coconut_shallow.obj', 'coconut_4.jpg', 10, -90, 40.0, 5, 1, 10, 3.8, [-1.041337, 0, 0], [-0.535, 0.0, -1.6, -0.53265, 0.0, 1.65748], 20.0, 0.1, 0.1, 0.12, 0.12);
	
	var CoconutShallowRIGHT = new stimulus('CoconutShallowRIGHT', 'coconut_shallow.obj', 'coconut_4.jpg', 10, -90, 40.0, 5, -1, 10, 3.8, [-1.041337, 0, 0], [-0.535, 0.0, 1.6, -0.53265, 0.0, -1.65748], 20.0, 0.1, 0.1, 0.12, 0.12);
	
	var HalfAppleExtremesLEFT = new stimulus('HalfAppleExtremesLEFT', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, 1, 10, 10, [-2.568784, -0.669885, -3.27716], [1.46237, 0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HalfAppleExtremesRIGHT = new stimulus('HalfAppleExtremesRIGHT', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, -1, 10, 10, [-2.568784, -0.669885, -3.27716], [1.46237, 0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HalfAppleLEFT = new stimulus('HalfAppleLEFT', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, 1, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HalfAppleCENTER1 = new stimulus('HalfAppleCENTER1', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, -1, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, -6.55508, -0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HalfAppleCENTER2 = new stimulus('HalfAppleCENTER2', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, 1, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, 1.46237, 0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HalfAppleRIGHT = new stimulus('HalfAppleRIGHT', 'half_apple_4.obj', 'half_apple_4.jpg', 96, 0, 45.0, 5, -1, 10, 10, [-2.568784, -0.669885, -3.27716], [-2.56, -0.0, -1.75, 1.46237, 0.0, -1.75], 22.5, 0.25, 0.25, 0.325, 0.325);
	
	var HumanFaceBollowEyebrowLEFT = new stimulus('HumanFaceBollowEyebrowLEFT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	var HumanFaceBollowEyebrowRIGHT = new stimulus('HumanFaceBollowEyebrowRIGHT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0, -1.4867, 4.2068, 0], 11.0, 0.1, 0.1);
	
	var HumanFaceBollowLEFT = new stimulus('HumanFaceBollowLEFT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, 1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, -1.6367, 2.2068, -0.1603], 11.0, 0.125, 0.125);

	var HumanFaceBollowRIGHT = new stimulus('HumanFaceBollowRIGHT', 'human_face_bollow.obj', 'human_face.jpg', 1, 0, 20.0, 5, -1, 13.5, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.351, 1.7667, 2.2068, -0.0722], 11.0, 0.125, 0.125);
	
	var HumanFaceHollowEyebrowLEFT = new stimulus('HumanFaceHollowEyebrowLEFT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	var HumanFaceHollowEyebrowRIGHT = new stimulus('HumanFaceHollowEyebrowRIGHT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [1.6367, 4.2068, 0.1, -1.4867, 4.2068, 0.1], 10.0, 0.1, 0.1);
	
	var HumanFaceHollowLEFT = new stimulus('HumanFaceHollowLEFT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, 1, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, 1.5367, 2.2068, 0.3693], 10.0, 0.1, 0.1);
	
	var HumanFaceHollowRIGHT = new stimulus('HumanFaceHollowRIGHT', 'human_face_hollow.obj', 'human_face.jpg', 16, 180, 20.0, 5, -1, 12, 6.64, [0.09701, 2.760507, 0.19454], [0.08, 2.15, 1.505, -1.4367, 2.2068, 0.303], 10.0, 0.1, 0.1);
	
	var MonkeyToyLEFT = new stimulus('MonkeyToyLEFT', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, 1, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, 4.79006], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyToyCENTER1 = new stimulus('MonkeyToyCENTER1', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, -1, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, 4.79006], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyToyCENTER2 = new stimulus('MonkeyToyCENTER2', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, 1, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, -4.77867], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyToyRIGHT = new stimulus('MonkeyToyRIGHT', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, -1, 10, 10.8, [0, 0, 0], [2.0, -1.3339, 0, 1.50413, -0.7, -4.77867], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyToyExtremesLEFT = new stimulus('MonkeyToyExtremesLEFT', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, 1, 10, 10.8, [0, 0, 0], [1.50413, -0.7, 4.79006, 1.50413, -0.7, -4.77867], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyToyExtremesRIGHT = new stimulus('MonkeyToyExtremesRIGHT', 'MonkeyToy3.obj', 'MonkeyToy3.jpg', 96, -90, 45.0, 5, -1, 10, 10.8, [0, 0, 0], [1.50413, -0.7, 4.79006, 1.50413, -0.7, -4.77867], 22.5, 0.25, 0.25, 0.3, 0.3);
	
	var MonkeyFaceBollowOffSnoutLEFT = new stimulus('MonkeyFaceBollowOffSnoutLEFT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.318, -0.44, 8.075, -9.57972, 5.0, 1.1087], 10.0, 0.4, 0.4);
	
	var MonkeyFaceBollowOffSnoutRIGHT = new stimulus('MonkeyFaceBollowOffSnoutRIGHT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-2.78, -0.09, 8.823, 8.89647, 4.0, 0.6036], 10.0, 0.4, 0.4);
	
	var MonkeyFaceBollowLEFT = new stimulus('MonkeyFaceBollowLEFT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11, -9.17972, 5.0, 1.4087], 10.0, 0.4, 0.4);
	
	var MonkeyFaceBollowRIGHT = new stimulus('MonkeyFaceBollowRIGHT', 'Monkey_Face_Bollow.obj', 'Monkey_Face_Bollow.jpg', 15, 0, 20.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [1.6625, -1.8, 10.8, 8.29647, 4.0, 1.4036], 10.0, 0.4, 0.4);
	
	var MonkeyFaceHollowOffSnoutLEFT = new stimulus('MonkeyFaceHollowOffSnoutLEFT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [-3.5, 0.46, 8.471, 8.29647, 4.0, 1.6], 8.5, 0.5, 0.5);
	
	var MonkeyFaceHollowOffSnoutRIGHT = new stimulus('MonkeyFaceHollowOffSnoutRIGHT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [4.51, 0.11, 7.96, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	var MonkeyFaceHollowLEFT = new stimulus('MonkeyFaceHollowLEFT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, 1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, 8.29647, 4.0, 1.8], 8.5, 0.5, 0.5);
	
	var MonkeyFaceHollowRIGHT = new stimulus('MonkeyFaceHollowRIGHT', 'Monkey_Face_Hollow.obj', 'Monkey_Face_Hollow.jpg', 15, 180, 17.0, 5, -1, 12, 21.7, [-0.217435, -0.403146, 4.528049], [0.6625, -1.8, 11.7, -8.07972, 5.0, 3.0], 8.5, 0.5, 0.5);
	
	var WholeAppleLEFT = new stimulus('WholeAppleLEFT', 'apple_18.obj', 'apple_18.jpg', 96, -90, 0, 5, 1, 10, 10, [-2.560498, -2.405302, -1.549059], [0.1038, -1.9658, -5.3794, 1.6837, -1.9658, 0.1910], 15.0, 0.35, 0.35, 0.4, 0.4);
	
	var WholeAppleRIGHT = new stimulus('WholeAppleRIGHT', 'apple_18.obj', 'apple_18.jpg', 96, -90, 0, 5, -1, 10, 10, [-2.560498, -2.405302, -1.549059], [1.4038, -1.9658, -3.7794, 0.8737, -1.9658, 1.5910], 15.0, 0.35, 0.35, 0.4, 0.4);
	
	var UpsideDownFaceHollowLEFT = new stimulus('UpsideDownFaceHollowLEFT', 'human_face_ud.obj', 'human_face.jpg', 16, 180, 20.0, 0, 1, 12, 6.64, [0.09701, 1.960507, 0.19454], [0.03, 2.705, 0.8505, 1.3367, 2.7068, 0.0993], 10.0, 0.1, 0.1);
	
	var UpsideDownFaceHollowRIGHT = new stimulus('UpsideDownFaceHollowRIGHT', 'human_face_ud.obj', 'human_face.jpg', 16, 180, 20.0, 0, 1, 12, 6.64, [0.09701, 1.960507, 0.19454], [-0.03, 2.705, 0.8505, -1.3367, 2.7068, 0.0993], 10.0, 0.1, 0.1);

	var Potato = new stimulus('Potato', 'egg.obj', 'potato_texture.jpg', 16, 180, 20.0, 0, 1, 1.32, 1.32, [0.09701, 10.960507, 0.19454], [-0.03, 2.705, 10.8505, -1.3367, 10.7068, 0.0993], 10.0, 0.3, 0.3);
	
	var stimList = [];
	if (expPhase == 'part1') {
		// only unambiguous stimuli
		stimList = [BananaExtremesLEFT, BananaExtremesRIGHT, BananaLEFT, BananaCENTER1, BananaCENTER2, BananaRIGHT, BananaFlatLEFT, BananaFlatCENTER1, BananaFlatCENTER2, BananaFlatRIGHT,  CoconutShallowLEFT, CoconutShallowRIGHT, HalfAppleExtremesLEFT, HalfAppleExtremesRIGHT, HalfAppleLEFT, HalfAppleCENTER1, HalfAppleCENTER2, HalfAppleRIGHT, MonkeyToyLEFT, MonkeyToyCENTER1, MonkeyToyCENTER2, MonkeyToyRIGHT, MonkeyToyExtremesLEFT, MonkeyToyExtremesRIGHT, WholeAppleLEFT, WholeAppleRIGHT];
		
		//without HalfApple
		//stimList = [BananaExtremesLEFT, BananaExtremesRIGHT, BananaLEFT, BananaCENTER1, BananaCENTER2, BananaRIGHT, BananaFlatLEFT, BananaFlatCENTER1, BananaFlatCENTER2, BananaFlatRIGHT,  CoconutShallowLEFT, CoconutShallowRIGHT, MonkeyToyLEFT, MonkeyToyCENTER1, MonkeyToyCENTER2, MonkeyToyRIGHT, MonkeyToyExtremesLEFT, MonkeyToyExtremesRIGHT, WholeAppleLEFT, WholeAppleRIGHT];
	} else if (expPhase == 'part2a') {
		// only illusory stimuli
		stimList = [BlankFaceHollowEyebrowLEFT, BlankFaceHollowEyebrowRIGHT, BlankFaceHollowLEFT, BlankFaceHollowRIGHT, CastoriaBollowLeftWall, CastoriaBollowRightWall, CastoriaBollowLEFT, CastoriaBollowRIGHT, HumanFaceHollowEyebrowLEFT, HumanFaceHollowEyebrowRIGHT, HumanFaceHollowLEFT, HumanFaceHollowRIGHT, MonkeyFaceHollowOffSnoutLEFT, MonkeyFaceHollowOffSnoutRIGHT, MonkeyFaceHollowLEFT, UpsideDownFaceHollowLEFT, UpsideDownFaceHollowRIGHT];
	} else if (expPhase == 'part2b') {
    	// catch phase - only unambiguous stimuli
		stimList = [BlankFaceBollowEyebrowLEFT, BlankFaceBollowEyebrowRIGHT, BlankFaceBollowLEFT, BlankFaceBollowRIGHT, CastoriaHollowRightWall, CastoriaHollowLeftWall, CastoriaHollowLEFT, CastoriaHollowRIGHT, HumanFaceBollowEyebrowLEFT, HumanFaceBollowEyebrowRIGHT, HumanFaceBollowLEFT, HumanFaceBollowRIGHT, MonkeyFaceBollowOffSnoutLEFT, MonkeyFaceBollowOffSnoutRIGHT, MonkeyFaceBollowLEFT, MonkeyFaceBollowRIGHT];
	}

	var monteCarlo = function() {
		//load stimulus
		stimList = [BananaExtremesLEFT, BananaExtremesRIGHT, BananaLEFT, BananaCENTER1, BananaCENTER2, BananaRIGHT, BananaFlatLEFT, BananaFlatCENTER1, BananaFlatCENTER2, BananaFlatRIGHT,  CoconutShallowLEFT, CoconutShallowRIGHT, HalfAppleExtremesLEFT, HalfAppleExtremesRIGHT, HalfAppleLEFT, HalfAppleCENTER1, HalfAppleCENTER2, HalfAppleRIGHT, MonkeyToyLEFT, MonkeyToyCENTER1, MonkeyToyCENTER2, MonkeyToyRIGHT, MonkeyToyExtremesLEFT, MonkeyToyExtremesRIGHT, WholeAppleLEFT, WholeAppleRIGHT];
		
		currStim = stimList[Math.floor(Math.random() * stimList.length)];
		currStim.obj.rot_num_change_dir = Math.floor(Math.random()*2)+2;
		
		//find left dot
		if (currStim.dots.g_pos[0] > currStim.dots.r_pos[0]) {
			leftDot = 'red';
			rightDot = 'green';
		} if (currStim.dots.g_pos[0] < currStim.dots.r_pos[0]) {
			leftDot = 'green';
			rightDot = 'red';
		}
		
		//find end positions
		if (currStim.obj.rot_init_dir == 1) {
			if (currStim.obj.rot_num_change_dir == 2) {
				frontDot = rightDot;
				backDot = leftDot;
			} if (currStim.obj.rot_num_change_dir == 3) {
				frontDot = leftDot;
				backDot = rightDot;
			}
		}
		
		if (currStim.obj.rot_init_dir == -1) {
			if (currStim.obj.rot_num_change_dir == 2) {
				frontDot = leftDot;
				backDot = rightDot;
			} if (currStim.obj.rot_num_change_dir == 3) {
				frontDot = rightDot;
				backDot = leftDot;
			}
		}
		
		//swap colors and differentiate size
		currStim.dots.color_flipped = Math.floor(Math.random()*2);
		if (Math.round(Math.random())) currStim.dots.r_is_big = true;
        else {currStim.dots.r_is_big = false;}
		
	
		if (currStim.dots.color_flipped == 1) {
	    	if (frontDot == 'green') {
	    		frontDot = 'red';
	    		backDot = 'green';
	    		mcFlipped++
	    	} else if (frontDot == 'red') {
	    		frontDot = 'green';
	    		backDot = 'red';
	    		mcFlipped++
	    	}
	    }
		//record color and size of closer dot
		if (frontDot == 'red') {
			mcRedCloser++
			if (currStim.dots.r_is_big) {
				if (currStim.dots.color_flipped == 1) {
					mcGreenLarge++
					mcGreenBigFar++
				} else {
					mcRedLarge++
					mcRedBigClose++
				}
			} else {
				if (currStim.dots.color_flipped == 1) {
					mcRedLarge++
					mcRedBigClose++
				} else {
					mcGreenLarge++
					mcGreenBigFar++
				}
			}
		}
		if (frontDot == 'green') {
			mcGreenCloser++
			if (currStim.dots.r_is_big) {
				if (currStim.dots.color_flipped == 1) {
					mcGreenLarge++
					mcGreenBigClose++
				} else {
					mcRedLarge++
					mcRedBigFar++
				}
			} else {
				if (currStim.dots.color_flipped == 1) {
					mcRedLarge++
					mcRedBigFar++
				} else {
					mcGreenLarge++
					mcGreenBigClose++
				}
			}
		}
		//continue
		trialNum++
		mcNext();
	};
	
	var mcNext = function() {
		if (trialNum == 1000) {
			finishExp();
		} else monteCarlo();
	}

    // function where we initialize the general 3D settings
	var threeDstuff = function() {
        // init vars
    	//currStim = stimList[Math.floor(Math.random() * stimList.length)];
		currStim = HalfAppleCENTER1;

		currStim.obj.scaling = currStim.obj.good_size/currStim.obj.size;
		currStim.obj.rot_num_change_dir = Math.round(Math.random())+2;
		//currStim.obj.rot_max_speed = 10;
		//currStim.obj.rot_min_speed = 10;
		//rotDir = currStim.obj.rot_init_dir;
		rotDir = 1;
		
		theta = 0;
        moving = true;
        num_change_dir = 0;
        
        // create a scene, that will hold all our elements such as objects, cameras and lights.		
        scene = new THREE.Scene();

        // create a camera, which defines where we're looking at.
        // field of view 45, proportions based on window size and near and far clipping planes
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
        
        // position and point the camera to the center of the scene
        //camera.position.set(0, 0, currStim.obj.distance);
        camera.position.set(0, 0, currStim.obj.distance); // raise camera so we can see if rotation is about object center
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
    					//monteCarlo();
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
    					//monteCarlo();
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

        loader.load("../static/images/objects/" + currStim.obj.file_name, function (object) {
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

            scene.add( objGroup );
        });

        // add dots to objGroup before we start transforming the object since that is easier
        // than trying to figure out the transformations to position the dots correctly
        // at a later time
        addDots();
                
        // rotate group - object with dots
		objGroup.rotation.y = currStim.obj.rot_init_ang;
		
		// draw line for rotation reference
		// var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
		// var lineGeometry = new THREE.Geometry();
		// lineGeometry.vertices.push(new THREE.Vector3(0, -100, 0));
		// lineGeometry.vertices.push(new THREE.Vector3(0, 100, 0));
		// var Line = new THREE.Line(lineGeometry,lineMaterial);
		// objGroup.add(Line);
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
            spotLights[i].intensity = 1;
            scene.add(spotLights[i]);
        }
        
        // if necessary add some ambient light
        //ambLight = new THREE.AmbientLight(0x404040);
        //scene.add(ambLight);
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
        currStim.dots.color_flipped = Math.floor(Math.random()*2);
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
		//if (expPhase == 'part1') document.getElementById("3dstuff").removeChild(responseDiv);
		
	    // remove old dom element 
	    document.getElementById("3dstuff").removeChild(webGLRenderer.domElement); 
	    if (expPhase == 'part1') {
			if (trialNum == maxNumTrialsPart1) {
				//getTheRule('B');
				ThreeDExperiment('part2a')
				finishExp();
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
	    //var closerDot, mcRedCloser = 0, mcGreenCloser = 0, mcGreenLarge = 0, mcRedLarge = 0, mcRedBigClose = 0, mcRedBigFar = 0, mcGreenBigClose = 0, mcGreenBigFar = 0;
	    if (mcRedCloser + mcGreenCloser != 1000) {
	    	document.writeln(currStim.name)
	    }
	    document.writeln("Dots Flipped " + mcFlipped);
	    document.writeln("Red Closer " + mcRedCloser);
	    document.writeln("Green Closer " + mcGreenCloser);
	    document.writeln("Red Larger " + mcRedLarge);
	    document.writeln("Green Larger " + mcGreenLarge);
	    document.writeln("Red Larger and Closer " + mcRedBigClose);
	    document.writeln("Red Larger and Farther " + mcRedBigFar);
	    document.writeln("Green Larger and Closer " + mcGreenBigClose);
	    document.writeln("Green Larger and Farther " + mcGreenBigFar);
	    
	    // finalize the HIT and so on
	    //$("body").unbind("keydown", response_handler); // Unbind keys
	    //currentview = new TheEnd();
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

    // start trial
    //threeDstuff();
    monteCarlo();
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
	    record_responses();
	    psiTurk.saveData();
	    currentview = new OtherRules();
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
		record_responses();
		psiTurk.saveData();
		psiTurk.doInstructions(
        	instructionPages2, // a list of pages you want to display in sequence
        	function() { currentview = new ThreeDExperiment('part2'); } // what you want to do when you are done with instructions
    	);});
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
                psiTurk.computeBonus('compute_bonus', function(){
                	psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                }); 


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
    	function() { currentview = new ThreeDExperiment('part1'); } // what you want to do when you are done with instructions
    );
});
