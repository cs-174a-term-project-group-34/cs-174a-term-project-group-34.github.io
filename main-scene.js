class Height_Map extends Entity {
    constructor(context, shadow_map, image, width, depth, subdivisions, min_height, max_height) {
	super(context);
	this.subdivisions = subdivisions;
	this.width = width;
	this.depth = depth;
	this.min_height = min_height;
	this.max_height = max_height;

	this.loaded = false;
	this.material = context.get_instance( Phong_Shader ).material(Color.of( 0, 0, 0, 1 ), { ambient: 0.2, specularity: 0.0, diffusivity: 1.0, texture: context.get_instance( "assets/terrainf3.png", true), shadow_map: shadow_map } );

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
	    self.geometry = new Grid_Patch( subdivisions - 1, subdivisions - 1, i => Vec.of(0, data[i * (subdivisions - 1) * subdivisions], i),
					    (j, p, i) => Vec.of(j, data[i * (subdivisions - 1) * subdivisions + j * (subdivisions - 1)], i), [[0,1], [1,0]] );
	    self.height_data = data;
	    self.submit_shapes( context, { map: self.geometry } );
	    self.loaded = true;
	};
	img.src = image;
    }

    draw(graphics_state, material_override) {
	if (this.loaded)
	    this.geometry.draw(graphics_state, Mat4.scale([this.width,1,this.depth]).times(Mat4.translation([-0.5,0,-0.5])), this.get_material(this.material, material_override));
    }

    sample_height(world_x, world_z) {
	var subdivisions = this.subdivisions;
	var z = (world_z + this.depth/2)/this.depth * subdivisions;
	var z1 = Math.ceil(z);
	var z0 = Math.floor(z);
	var x = (world_x + this.width/2)/this.width * subdivisions;
	if (x < 0 || x > subdivisions) return undefined;
	var x1 = Math.ceil(x);
	var x0 = Math.floor(x);
	var x0_z_height = this.height_data[z0 * subdivisions + x0] * (z1 - z) + this.height_data[z1 * subdivisions + x0] * (z - z0);
	var x1_z_height = this.height_data[z0 * subdivisions + x1] * (z1 - z) + this.height_data[z1 * subdivisions + x1] * (z - z0);
	return x0_z_height * (x1 - x) + x1_z_height * (x - x0);
    }
}

class Player extends Entity {
    constructor(context, control_box, height_map, min_y, initial_pos = Vec.of(250,0,100), initial_dir = Vec.of(0,0,1), run_speed = 67.05, look_speed = 0.2, height = 1.75) {
	super(context, control_box);

	this.height_map = height_map;
	this.min_y = min_y;

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
	if (new_pitch >= Math.PI/2) new_pitch = Math.PI/2 - 0.001;
	else if (new_pitch <= -Math.PI/2) new_pitch = -Math.PI/2 + 0.001;

	var axis = this.up.cross(this.dir).normalized();
	this.dir = Mat4.rotation(this.mouse.movement[0] * this.radians_per_frame * dt, Vec.of(0,-1,0)).times(Mat4.rotation(new_pitch - this.pitch, axis)).times(this.dir.to4(false)).to3();
	this.pitch = new_pitch; this.mouse.movement[0] = 0; this.mouse.movement[1] = 0;

	var right = this.dir.cross(this.up);
	var old_pos = this.pos.copy();
	this.pos[0] += this.forward * this.dir[0] * this.speed * dt;
	this.pos[2] += this.forward * this.dir[2] * this.speed * dt;

	this.pos[0] -= this.backward * this.dir[0] * this.speed * dt;
	this.pos[2] -= this.backward * this.dir[2] * this.speed * dt;

	this.pos[0] += this.right * right[0] * this.speed * dt;
	this.pos[2] += this.right * right[2] * this.speed * dt;

	this.pos[0] -= this.left * right[0] * this.speed * dt;
	this.pos[2] -= this.left * right[2] * this.speed * dt;

	if(this.height_map.loaded) {
	    var height_sample = this.height_map.sample_height(this.pos[0], this.pos[2]);
	    if (!height_sample || height_sample < this.min_y)
		this.pos = old_pos;
	    else
		this.pos[1] = this.height_map.sample_height(this.pos[0], this.pos[2]) + this.height;
	}
    }

    update(graphics_state) {
	this.calculateMovement(graphics_state.animation_delta_time / 1000);
	graphics_state.camera_transform = Mat4.look_at(this.pos, this.pos.plus(this.dir), this.up);
    }

    draw(graphics_state, material_override) { }
}

class Water extends Entity {
    constructor(context, shadow_map, size, z_pos) {
	super(context);
	this.size = size;
	this.z_pos = z_pos;
	this.geometry = new Cube();
	for( var i = 0; i < this.geometry.texture_coords.length; i++ ) {
	    this.geometry.texture_coords[i] = this.geometry.texture_coords[i].times(10);
	}

	this.material = context.get_instance( Water_Shader ).material(Color.of( 0, 0, 0, 0.5), { ambient: 0.2, specularity: 1.0, diffusivity: 1.0, reflectivity: 0.85, texture: context.get_instance( "assets/water.jpg", true ), shadow_map: shadow_map, envmap: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ), bump_map: context.get_instance("assets/water_bumpmap.jpg", true) } );

	this.submit_shapes(context, {water: this.geometry});
    }

    draw(graphics_state, material_override) {
	this.geometry.draw(graphics_state, Mat4.translation([0,this.z_pos,0]).times(Mat4.scale([this.size/2, 0.05, this.size/2])), this.get_material(this.material, material_override));
    }
}

class Sky_Box extends Entity {
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
      this.webgl_manager = context;

      this.shadow_shader = context.get_instance(Shadow_Shader).material();
      this.create_shadow_framebuffer(context.gl);

      this.map = new Height_Map(context, this.shadow_map, "assets/heightmapf5.png", 1000, 1000, 512, -100, 200);
      this.water_height = -50.5;
      this.entities = [ this.map, this.player = new Player(context, control_box.parentElement.insertCell(), this.map, this.water_height), this.water = new Water(context, this.shadow_map, 1000, this.water_height), new Sky_Box(context, 5000), this.fishing_rod = new FishingRod(context, control_box.parentElement.insertCell())]
      this.shadowers = [ this.map, this.fishing_rod ];
      const r = context.width/context.height;
      context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/3, r, .1, 5000 );

      this.light = new Light( Vec.of( 500,250,-500,0 ), Color.of( 1,1,0.5,1 ), 10000, Vec.of(-600, -600, -600), Vec.of(600, 600, 600));
    }
    create_shadow_framebuffer(gl) {
	this.shadow_map_size = 1024;

	gl.getExtension("WEBGL_depth_texture");
	this.shadow_map = new Texture(gl, "", false, false);
	gl.bindTexture(gl.TEXTURE_2D, this.shadow_map.id);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, this.shadow_map_size, this.shadow_map_size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	var light_texture = new Texture(gl, "", false, false);
	var color_buffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, color_buffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, this.shadow_map_size, this.shadow_map_size);

	this.shadow_map_fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_map_fb);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color_buffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadow_map.id, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    {
	this.key_triggered_button( "Unlock Mouse", [ "u" ], () => { document.exitPointerLock = document.exitPointerLock    || document.mozExitPointerLock;   document.exitPointerLock(); } );
    }
    display( graphics_state )
    {
	graphics_state.light = this.light;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

	for (var i = 0; i < this.entities.length; i++) {
	    this.entities[i].update(graphics_state);
	}

	var gl = this.webgl_manager.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadow_map_fb);
	gl.viewport(0,0, this.shadow_map_size, this.shadow_map_size);
	this.webgl_manager.gl.clear( this.webgl_manager.gl.DEPTH_BUFFER_BIT );
	for (var i = 0; i < this.shadowers.length; i++) {
	    this.shadowers[i].draw(graphics_state, this.shadow_shader);
	}

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	for (var i = 0; i < this.entities.length; i++) {
	    this.entities[i].draw(graphics_state);
	}

    }
  }
