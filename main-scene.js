window.Final_Project = window.classes.Final_Project =
class Final_Project extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { torus:  new Torus( 15, 15 ) };
        this.submit_shapes( context, shapes );
                                     
                                     // Make some Material objects available to you:
        this.materials =
          { torus: context.get_instance( Phong_Shader ).material( Color.of( 0.745, 0.765, 0.776, 1 ), { ambient: 0, specularity: 0, diffusivity: 0.5 }) }

        this.lights = [ new Light( Vec.of( -5,5,5,1 ), Color.of( 0,1,1,1 ), 100000 ) ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      {       }
    display( graphics_state )
    {   graphics_state.lights = this.lights;
          const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

	  this.shapes.torus.draw( graphics_state, Mat4.identity(), this.materials.torus );
      }
  }
