window.Final_Project = window.classes.Final_Project =
class Final_Project extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,0 ), Vec.of( 0,0,100 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1500 );

	create_height_map("assets/heightmap.jpg", 128, -200, 300, (gp) => {
            const shapes = { skybox: new Cube(),
			     water: new Square(),
			     map: gp
			   };
	    for( var i = 0; i < shapes.water.texture_coords.length; i++ ) {
		shapes.water.texture_coords[i] = shapes.water.texture_coords[i].times(10);
	    }
            this.submit_shapes( context, shapes );
	});
        
                                     // Make some Material objects available to you:
        this.materials =
        {
	    skybox: context.get_instance( Skybox_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, cube_texture: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ) } ),
	    water: context.get_instance( Water_Shader ).material(Color.of( 0, 0, 0, 0.85), { ambient: 0.5, specularity: 0, diffusivity: 0.8, reflectivity: 0.30, texture: context.get_instance( "assets/water.jpg", true ), envmap: context.get_instance( [ "assets/skybox/rt.png", "assets/skybox/lf.png", "assets/skybox/up.png", "assets/skybox/dn.png", "assets/skybox/bk.png", "assets/skybox/ft.png" ], true ) } ),
	    map: context.get_instance( Phong_Shader ).material(Color.of( 0, 0, 0, 1 ), { ambient: 0.5, specularity: 0, diffusivity: 0.8, texture: context.get_instance( "assets/terrain.jpg", true) } )
	}

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      {       }
    display( graphics_state )
    {
	if (!this.shapes) return;
	graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

	this.shapes.skybox.draw(graphics_state, Mat4.scale([500, 500, 500]), this.materials.skybox);
	this.shapes.map.draw(graphics_state, Mat4.scale([1000,1,1000]).times(Mat4.translation([-0.5,0,-0.5])), this.materials.map);
	this.shapes.water.draw(graphics_state, Mat4.translation([0,-110,0]).times(Mat4.rotation(Math.PI/2, Vec.of(1,0,0))).times(Mat4.scale([500, 500, 500])), this.materials.water);	
    }
  }


function create_height_map (image, subdivisions, min_height, max_height, callback) {
    var img = new Image();
    img.onload = () => {	
	var canvas = document.createElement( 'canvas' );
	canvas.width = subdivisions;
	canvas.height = subdivisions;
	var context = canvas.getContext( '2d' );

	var size = subdivisions * subdivisions, data = new Float32Array( size );
	
	context.drawImage(img,0,0);
	
	var imgd = context.getImageData(0, 0, subdivisions, subdivisions);
	var pix = imgd.data;
	
	var j=0;
	for (var i = 0, n = pix.length; i < n; i += (4)) {
	    var all = pix[i]+pix[i+1]+pix[i+2];
	    data[j++] = min_height + all/(255+255+255) * max_height;
	}
	var gp = new Grid_Patch( subdivisions, subdivisions, i => Vec.of(0, data[Math.floor(i * subdivisions * subdivisions)], i),
				 (j, p, i) => Vec.of(j, data[Math.floor(i * subdivisions * subdivisions + j * subdivisions)], i), [[0,1], [1,0]]);
	callback(gp);
    };
    img.src = image;
}
