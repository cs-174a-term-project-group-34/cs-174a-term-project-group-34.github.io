class Height_Map extends Scene_Component {
    constructor(context, image, width, depth, subdivisions, min_height, max_height) {
	super(context);
	this.subdivisions = subdivisions;
	this.width = width;
	this.depth = depth;
	this.min_height = min_height;
	this.max_height = max_height;
	
	this.loaded = false;
	this.material = context.get_instance( Phong_Shader ).material(Color.of( 0, 0, 0, 1 ), { ambient: 0.5, specularity: 0, diffusivity: 0.3, texture: context.get_instance( "assets/terrain.jpg", true) } );

	var self = this;
	var img = new Image();
	img.onload = () => {	
	    var canvas = document.createElement( 'canvas' );
	    canvas.width = subdivisions;
	    canvas.height = subdivisions;
	    var img_context = canvas.getContext( '2d' );
	    
	    var size = subdivisions * subdivisions, data = new Float32Array( size );
	    
	    img_context.drawImage(img,0,0);
	    
	    var imgd = img_context.getImageData(0, 0, subdivisions, subdivisions);
	    var pix = imgd.data;
	    
	    var j=0;
	    for (var i = 0, n = pix.length; i < n; i += (4)) {
		var all = pix[i]+pix[i+1]+pix[i+2];
		data[j++] = min_height + all/(255+255+255) * max_height;
	    }
	    self.geometry = new Grid_Patch( subdivisions, subdivisions, i => Vec.of(0, data[Math.floor(i * subdivisions * subdivisions)], i),
					    (j, p, i) => Vec.of(j, data[Math.floor(i * subdivisions * subdivisions + j * subdivisions)], i), [[0,1], [1,0]]);
	    self.height_data = data;
	    self.submit_shapes( context, { map: self.geometry } );
	    self.loaded = true;
	};
	img.src = image;
    }

    draw(graphics_state) {
	if (this.loaded)
	    this.geometry.draw(graphics_state, Mat4.scale([this.width,1,this.depth]).times(Mat4.translation([-0.5,0,-0.5])), this.material);
    }

    sample_height(world_x, world_z) {
	var subdivisions = this.subdivisions;
	var z = (world_z + this.depth/2)/this.depth * subdivisions;
	var z1 = Math.ceil(z);
	var z0 = Math.floor(z);
	var x = (world_x + this.width/2)/this.width * subdivisions;
	var x1 = Math.ceil(x);
	var x0 = Math.floor(x);
	var x0_z_height = this.height_data[z0 * subdivisions + x0] * (z1 - z) + this.height_data[z1 * subdivisions + x0] * (z - z0);
	var x1_z_height = this.height_data[z0 * subdivisions + x1] * (z1 - z) + this.height_data[z1 * subdivisions + x1] * (z - z0);
	return x0_z_height * (x1 - x) + x1_z_height * (x - x0);
    }
}

class Player extends Scene_Component {
    constructor(context, control_box, height_map, initial_pos = Vec.of(150,0,1), initial_dir = Vec.of(0,0,1), run_speed = 6.705, look_speed = 0.2, height = 1.75) {
	super(context, control_box);
	
	this.height_map = height_map;

	this.speed = run_speed;
	this.radians_per_frame = look_speed;
	this.height = height;

	this.pos = initial_pos;
	this.dir = initial_dir;
	this.pitch  = 0;
	this.up = Vec.of(0,1,0);

	this.forward = 0;
	this.backward = 0;
	this.left = 0;
	this.right = 0;

	// *** Mouse controls: ***
	this.mouse = { "movement": Vec.of( 0,0 ) };                           // Measure mouse steering, for rotating the flyaround camera:
	let canvas = context.canvas;
	const mouse_position = ( e, rect = canvas.getBoundingClientRect() ) => 
              Vec.of( e.clientX - (rect.left + rect.right)/2, e.clientY - (rect.bottom + rect.top)/2 );
	// Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
	canvas  .addEventListener( "mousedown", e => { canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;canvas.requestPointerLock() } );
	canvas  .addEventListener( "mousemove", e => {
	    e.preventDefault();
	    if( document.pointerLockElement === canvas || document.mozPointerLockElement === canvas ) {
		this.mouse.movement[0] = e.movementX;
		this.mouse.movement[1] = e.movementY;
	    }
	} );
	
	this.key_triggered_button( "Forward", [ "w" ], () => this.forward = 1, undefined, () => this.forward = 0 );
	this.key_triggered_button( "Backward", [ "s" ], () => this.backward = 1, undefined, () => this.backward = 0 );
	this.key_triggered_button( "Left", [ "a" ], () => this.left = 1, undefined, () => this.left = 0 );
	this.key_triggered_button( "Right", [ "d" ], () => this.right = 1, undefined, () => this.right = 0 );
    }

    calculateMovement(dt, leeway = 70) {
	var new_pitch =  this.pitch + this.mouse.movement[1] * this.radians_per_frame * dt;
	if (new_pitch >= Math.PI/2 - 0.001) new_pitch = Math.PI/2 - 0.001;
	else if (new_pitch < -Math.PI/2 + 0.001) new_pitch = -Math.PI/2 + 0.001;

	var axis = this.up.cross(this.dir).normalized();
	this.dir = Mat4.rotation(this.mouse.movement[0] * this.radians_per_frame * dt, Vec.of(0,-1,0)).times(Mat4.rotation(new_pitch - this.pitch, axis)).times(this.dir.to4(false)).to3();
	this.pitch = new_pitch; this.mouse.movement[0] = 0; this.mouse.movement[1] = 0;

	var right = this.dir.cross(this.up);
	this.pos[0] += this.forward * this.dir[0] * this.speed * dt;
	this.pos[2] += this.forward * this.dir[2] * this.speed * dt;

	this.pos[0] -= this.backward * this.dir[0] * this.speed * dt;
	this.pos[2] -= this.backward * this.dir[2] * this.speed * dt;

	this.pos[0] += this.right * right[0] * this.speed * dt;
	this.pos[2] += this.right * right[2] * this.speed * dt;

	this.pos[0] -= this.left * right[0] * this.speed * dt;
	this.pos[2] -= this.left * right[2] * this.speed * dt;

	if(this.height_map.loaded) {
	    this.pos[1] = this.height_map.sample_height(this.pos[0], this.pos[2]) + this.height;
	}
    }

    draw(graphics_state) {
	this.calculateMovement(graphics_state.animation_delta_time / 1000);
	graphics_state.camera_transform = Mat4.look_at(this.pos, this.pos.plus(this.dir), this.up);
    }
}

class Water extends Scene_Component {
    constructor(context, size, z_pos) {
	super(context);
	this.size = size;
	this.z_pos = z_pos;
	this.geometry = new Square();
	for( var i = 0; i < this.geometry.texture_coords.length; i++ ) {
	    this.geometry.texture_coords[i] = this.geometry.texture_coords[i].times(10);
	}

	this.material = context.get_instance( Water_Shader ).material(Color.of( 0, 0, 0, 0.85), { ambient: 0.5, specularity: 1.0, diffusivity: 0.3, reflectivity: 0.30, texture: context.get_instance( "assets/water.jpg", true ), envmap: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ) } );
	
	this.submit_shapes(context, {water: this.geometry});
    }

    draw(graphics_state) {
	this.geometry.draw(graphics_state, Mat4.translation([0,this.z_pos,0]).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))).times(Mat4.scale([this.size/2, this.size/2, this.size/2])), this.material);
    }
}

class Sky_Box extends Scene_Component {
    constructor(context, size) {
	super(context);

	this.size = size;
	this.geometry = new Cube();
	this.material = context.get_instance( Skybox_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, cube_texture: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ) } );

	this.submit_shapes(context, {skybox: this.geometry});
    }

    draw(graphics_state) {
	this.geometry.draw(graphics_state, Mat4.scale([this.size/2, this.size/2, this.size/2]), this.material);
    }
}
window.Final_Project = window.classes.Final_Project =
class Final_Project extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
    { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
      this.map = new Height_Map(context, "assets/heightmap.jpg", 1000, 1000, 128, -200, 300);
      this.player = new Player(context, control_box.parentElement.insertCell(), this.map);
      this.water = new Water(context, 1000, -110);
      this.skybox = new Sky_Box(context, 1000);
	  
      const r = context.width/context.height;
      context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/3, r, .1, 1500 );
	  
      this.lights = [ new Light( Vec.of( 500,500,500,0 ), Color.of( 1,1,0.5,1 ), 10000000 ) ];
    }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    {
	this.key_triggered_button( "Unlock Mouse", [ "u" ], () => { document.exitPointerLock = document.exitPointerLock    || document.mozExitPointerLock;   document.exitPointerLock(); } );
    }    
    display( graphics_state )
    {
	graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

	this.player.draw(graphics_state);
	this.skybox.draw(graphics_state);
	this.map.draw(graphics_state);
	this.water.draw(graphics_state);
    }
  }
