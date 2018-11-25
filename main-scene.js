window.Final_Project = window.classes.Final_Project =
class Final_Project extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,0,0 ), Vec.of( 0,0,1 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { skybox_side: new Square()};
        this.submit_shapes( context, shapes );
                                     
                                     // Make some Material objects available to you:
        this.materials =
        {
	    skybox: [
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/dn.png", true ) }),
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/up.png", true ) }),
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/lf.png", true ) }),
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/rt.png", true ) }),
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/bk.png", true ) }),
		context.get_instance( Phong_Shader ).material( Color.of( 0, 0, 0, 1 ), { ambient: 1, specularity: 0, diffusivity: 0, texture: context.get_instance( "assets/skybox/ft.png", true ) })
	    ]
	}

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      {       }
    display( graphics_state )
    {   graphics_state.lights = this.lights;
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

	this.draw_skybox(graphics_state);  
    }
    draw_skybox(graphics_state) {
	for( var i = 0; i < 3; i++ )                    
            for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
              .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
              .times( Mat4.translation([ 0, 0, 100 ]) )
	      .times( Mat4.scale([100.5,100.5,100.5]) );
	  this.shapes.skybox_side.draw( graphics_state, square_transform, this.materials.skybox[2*i + j] );
        }
    }
  }
