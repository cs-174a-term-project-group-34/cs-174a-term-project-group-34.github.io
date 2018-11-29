window.FishingRod = window.classes.FishingRod =
class FishingRod extends Entity
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:

        const shapes = {'box': new Cube(),
                        'cylinder': new Surface_Of_Revolution(3,20, [Vec.of(0,0,1),Vec.of(0,1,1),Vec.of(0,1,-1),Vec.of(0,0,-1)], [ [ 0, 1 ], [ 0,20 ] ]),//new Cube(),               // At the beginning of our program, load one of each of these shape
                        'ball': new Subdivision_Sphere(4)}      // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                          // the one called "box" more than once in display() to draw
                                                          // multiple cubes.  Don't define more than one blueprint for the
                                                          // same thing here.

                                     // Make some Material objects available to you:
        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( .9,.5,.9, 1 ), { ambient: .4, diffusivity: .4 } );
        this.plastic = this.clay.override({ specularity: .6 });
        this.casting = 0;
        this.windUp = 0;
        this.casted = 0;
        this.fishing = 1;
        this.key_triggered_button( "Cast", [ "k" ], () => this.casting = this.windUp = 1, undefined, () => this.windUp = 0 );
        this.key_triggered_button( "Reel", [ "l" ], () => this.casting = 0);
        this.key_triggered_button( "Fish", [ "f" ], () => this.fishing = !this.fishing);
        this.time = 0;
      }
    update(graphics_state){
        if(!this.fishing){
            this.casting = 0;
            this.windUp = 0;
            this.casted = 0;
            this.time = 0;
        }
        if(this.casting){
            this.time += graphics_state.animation_delta_time/2;
            if(this.windUp && !this.casted){
                if(this.time > 500){
                    this.time = 500;
                }
            }else{
                this.casted = 1;
            }
            if(this.time > 1200){
                this.time = 1200;
            }
        }else{
            this.time = 0;
            this.casted = 0;
        }
    }
    draw( graphics_state, material_override )
      {
          if(!this.fishing){
              return;
          }
        const REST = 0;
        const WIND_UP = 500;
        const FLICK = 600;
        const STRAIGTEN = 650;
        const FALL = 1200;
        const ANGLE_A = Math.PI/8;
        const ANGLE_B = Math.PI/6;
        const ANGLE_C = Math.PI/4;
        const FLICK_EXTENSION = 0.1;
        const STRAIGTEN_EXTENSION = 0.25;
        const ROD_HEIGHT = 1.3;
        const NUM_SEG = 8;
        const MIN_LINE_LEN = 0.25;
        const BUBBLE_SIZE = 0.04;
        const ROD_CIRC = 0.015;
        const REST_ANGLE = Math.asin(BUBBLE_SIZE/(MIN_LINE_LEN*2));
        const MAX_LINE_LEN = 10;
        const LINE_ANGLE = Math.PI/2+Math.asin(ROD_HEIGHT/MAX_LINE_LEN)-ANGLE_C-ANGLE_B;
        var time = this.time;// % 1200;
        //Position rod in fpv
        let model_transform = Mat4.inverse(graphics_state.camera_transform);
        model_transform = model_transform.times( Mat4.translation([ 0.5, -0.3, -1 ]) );
        model_transform = model_transform.times( Mat4.rotation( -Math.PI/2, Vec.of( 0,1,0 ) ) );//

        //Draw rod handle
        model_transform = model_transform.times( Mat4.translation([ 0, -ROD_HEIGHT/2, 0 ]) );
        if(time <= REST){
            ;
        }else if(time < WIND_UP){
            model_transform = model_transform.times( Mat4.rotation(-ANGLE_A*(time-REST)/(WIND_UP-REST), Vec.of( 0,0,1 ) ) );
        }else if(time < FLICK){
            model_transform = model_transform.times( Mat4.rotation(-ANGLE_A+(ANGLE_A+ANGLE_C)*(time-WIND_UP)/(FLICK-WIND_UP), Vec.of( 0,0,1 ) ) );
        }else if(time < STRAIGTEN){
            model_transform = model_transform.times( Mat4.rotation(ANGLE_C, Vec.of( 0,0,1 ) ) );
        }else{
            model_transform = model_transform.times( Mat4.rotation(ANGLE_C, Vec.of( 0,0,1 ) ) );
        }
        model_transform = model_transform.times( Mat4.translation([ 0, ROD_HEIGHT/2, 0 ]) );
          this.shapes.cylinder.draw( graphics_state, model_transform.times( Mat4.scale([ ROD_CIRC, ROD_HEIGHT/4, ROD_CIRC ])).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0.6,0.4,0.2,1) }), material_override ));

        //Draw rod top
        model_transform = model_transform.times( Mat4.translation([ 0, ROD_HEIGHT/4, 0 ]) );
        model_transform = model_transform.times( Mat4.translation([ 0, ROD_HEIGHT/(4*NUM_SEG), 0 ]) );
        for(var i = 0; i < NUM_SEG; i++){
            model_transform = model_transform.times( Mat4.translation([ 0, -ROD_HEIGHT/(4*NUM_SEG), 0 ]) );
            if(time <= REST){
                ;
            }else if(time < WIND_UP){
                model_transform = model_transform.times( Mat4.rotation(-ANGLE_B/NUM_SEG*(time-REST)/(WIND_UP-REST), Vec.of( 0,0,1 ) ) );
            }else if(time < FLICK){
                model_transform = model_transform.times( Mat4.rotation(-ANGLE_B/NUM_SEG, Vec.of( 0,0,1 ) ) );
            }else if(time < STRAIGTEN){
                model_transform = model_transform.times( Mat4.rotation(-ANGLE_B/NUM_SEG*(STRAIGTEN-time)/(STRAIGTEN-FLICK), Vec.of( 0,0,1 ) ) );
            }else{
                model_transform = model_transform.times( Mat4.rotation(ANGLE_B/NUM_SEG*(time-STRAIGTEN)/(FALL-STRAIGTEN), Vec.of( 0,0,1 ) ) );
            }
            model_transform = model_transform.times( Mat4.translation([ 0, ROD_HEIGHT/(4*NUM_SEG), 0 ]) );
            this.shapes.cylinder.draw( graphics_state, model_transform.times( Mat4.scale([ ROD_CIRC, ROD_HEIGHT/(4*NUM_SEG)+0.01, ROD_CIRC ])).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0.6,0.4,0.2,1) }), material_override));
            model_transform = model_transform.times( Mat4.translation([ 0, ROD_HEIGHT/(2*NUM_SEG), 0 ]) );
        }

        //Draw line
        model_transform = model_transform.times( Mat4.translation([ 0, -ROD_HEIGHT/(4*NUM_SEG), 0 ]) );
        var scale = MIN_LINE_LEN;
        if(time <= REST){
            model_transform = model_transform.times( Mat4.rotation(Math.PI+REST_ANGLE, Vec.of( 0,0,1 ) ) );
        }else if(time < WIND_UP){
            model_transform = model_transform.times( Mat4.rotation(Math.PI+(REST_ANGLE+(ANGLE_A+ANGLE_B-REST_ANGLE)*(time-REST)/(WIND_UP-REST)), Vec.of( 0,0,1 ) ) );
        }else if(time < FLICK){
            model_transform = model_transform.times( Mat4.rotation(Math.PI+(ANGLE_A+ANGLE_B+(Math.PI-ANGLE_A-ANGLE_B)*(time-WIND_UP)/(FLICK-WIND_UP)), Vec.of( 0,0,1 ) ) );
            scale += (MAX_LINE_LEN-MIN_LINE_LEN)*FLICK_EXTENSION*(time-WIND_UP)/(FLICK-WIND_UP);
        }else if(time < STRAIGTEN){
            scale += (MAX_LINE_LEN-MIN_LINE_LEN)*(FLICK_EXTENSION+(STRAIGTEN_EXTENSION-FLICK_EXTENSION)*(time-WIND_UP)/(FLICK-WIND_UP));
        }else{
            model_transform = model_transform.times( Mat4.rotation(LINE_ANGLE*(time-FLICK)/(FALL-FLICK), Vec.of( 0,0,1 ) ) );
            scale += (MAX_LINE_LEN-MIN_LINE_LEN)*(STRAIGTEN_EXTENSION+(1-STRAIGTEN_EXTENSION)*(time-FLICK)/(FALL-FLICK));
        }
        model_transform = model_transform.times( Mat4.translation([ 0, scale, 0 ]) );
          this.shapes.cylinder.draw( graphics_state, model_transform.times( Mat4.scale([ ROD_CIRC/4, scale, ROD_CIRC/4 ])).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0,0,0.2,0.2) }), material_override) );

        // Draw Bubble
        model_transform = model_transform.times( Mat4.translation([ 0, scale, 0 ]) );
          this.shapes.ball.draw( graphics_state, model_transform.times( Mat4.scale([ BUBBLE_SIZE, BUBBLE_SIZE, BUBBLE_SIZE ])), this.get_material(this.plastic.override({ color: Color.of(1,0,0,1)}), material_override));
        model_transform = model_transform.times( Mat4.translation([ 0, 0.01, 0 ]) );
          this.shapes.ball.draw( graphics_state, model_transform.times( Mat4.scale([ BUBBLE_SIZE, BUBBLE_SIZE, BUBBLE_SIZE ])), this.get_material(this.plastic.override({ color: Color.of(1,1,1,1)}), material_override) );
      }
  }
