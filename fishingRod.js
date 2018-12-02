window.FishingRod = window.classes.FishingRod =
class FishingRod extends Entity
  { constructor( context, control_box, player, dock)     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:

        const shapes = {'box': new Cube(),
                        'cylinder': new Surface_Of_Revolution(3,20, [Vec.of(0,0,1),Vec.of(0,1,1),Vec.of(0,1,-1),Vec.of(0,0,-1)], [ [ 0, 1 ], [ 0,20 ] ]),//new Cube(),               // At the beginning of our program, load one of each of these shape
                        'ball': new Subdivision_Sphere(4),
                        'fish': new Shape_From_File("assets/fish.obj"),
                        'reel': new Shape_From_File("assets/reel.obj")}      // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                          // the one called "box" more than once in display() to draw
                                                          // multiple cubes.  Don't define more than one blueprint for the
                                                          // same thing here.

                                     // Make some Material objects available to you:
        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( .9,.5,.9, 1 ), { ambient: .4, diffusivity: .4 } );
        this.plastic = this.clay.override({ specularity: .6 });
        this.texture   = context.get_instance( Phong_Shader ).material( Color.of( 0,0,0, 1 ), { ambient: .8, diffusivity: .2, specularity: 0 } );
        this.fish_texture = this.texture.override({texture: context.get_instance( "assets/fish_texture.png", true )});
        this.states = {
            walking: 0,
            fishing_rest: 1,
            wind_up: 2,
            casting: 3,
            waiting: 4,
            reel_in: 5,
            reel_fish: 6,
            slack_fish: 7,
            reel_up: 8,
            hanging: 9,
        }
        this.player = player;
        this.dock = dock;
        this.state = this.states.walking;
        this.parameter = 0;
        this.space_pressed = false;
        this.casting = 0;
        this.windUp = 0;
        this.casted = 0;
        this.fishing = 1;
        this.power = 0;
        this.reel_fish = 0;
        this.fish = false;
        this.has_bubble = true;
        this.overlay_player_pos = 0;
        this.overlay_fish_pos = 0;
        this.overlay_speed = -1.0;
        this.overlay_fish_speed = 1.0;
        this.winning = false;
        this.key_triggered_button( "Cast", [ "c" ], () => {
            if (this.state == this.states.fishing_rest || this.state == this.states.hanging) {
                this.space_pressed = true;
                this.state = this.states.wind_up;
                this.parameter = 0;
                this.power = 2;
            }
        }, undefined, () => {
            if (this.state == this.states.wind_up){
                this.space_pressed = false;
            }
        } );
        this.key_triggered_button( "Reel", [ "x" ], () => {
            // Copy the movement thing to have the press and release logic
            if(this.fish && (this.state == this.states.reel_fish || this.state == this.states.slack_fish)){
                this.state = this.states.reel_fish
            } else {
                if (this.state == this.states.waiting){
                    this.state = this.states.reel_in;
                } 
            }
        }, undefined, () => {
            if (this.state == this.states.reel_fish) {
                this.state = this.states.slack_fish      
            }
        });
        this.key_triggered_button( "Fish", [ "f" ], () => {
            var toggleFishing = this.player.toggleFishing();
            this.clear_reel()
            this.clear_windup()
            this.fish = 0;
            if (this.state == this.states.walking && toggleFishing){
                this.state = this.states.fishing_rest;
            } else {
                this.state = this.states.walking;
            }
        });
        this.time = 0;
      }
    update(graphics_state){
        var states = this.states;
        switch (this.state){
            case states.walking:
            case states.fishing_rest:
                this.parameter = 0;
                this.power = 0;
                break;
            case states.wind_up:
                this.has_bubble = true
                this.windup_overlay();
                this.fish = false;
                this.parameter += graphics_state.animation_delta_time/2;
                if (this.space_pressed) {
                    this.power += graphics_state.animation_delta_time/300;
                    if(this.power > 8){
                        this.power = 2;
                    }
                    this.parameter = Math.min(500, this.parameter);
                } else if (this.parameter >= 500){
                    this.state = states.casting;
                } else {
                    this.parameter = Math.min(500, this.parameter);
                }
                console.log(this.power)
                break;
            case states.casting:
                this.clear_windup()
                this.parameter += graphics_state.animation_delta_time/2;
                this.parameter = Math.min(1200, this.parameter);
                if (this.parameter == 1200) {
                    this.state = states.waiting;
                    if(true){
                    // if(this.dock.check_bite(this.power, this.player.getDir())){
                        this.fish = true;
                        this.state = this.states.slack_fish;
                    }
                }
                break;
            case states.waiting:
                if(true){
                // if(this.dock.check_bite(this.power, this.player.getDir())){
                    this.fish = true;
                    this.state = this.states.slack_fish;
                }
                break;
            case states.reel_in:
                this.clear_reel()
                this.power -= graphics_state.animation_delta_time/500;
                this.power = Math.max(this.power, 0);
                if (this.power == 0){
                    this.state = states.reel_up;
                }
                this.parameter = 1;
                break;
            case states.reel_fish:
                // alert("in reel fish")
                this.reel_overlay()
                this.power -= graphics_state.animation_delta_time/500;
                this.power = Math.max(this.power, 0);
                if (this.power == 0){
                    this.state = states.reel_up;
                }
                this.parameter = 1;
                break;
            case states.slack_fish:
                // alert("in slack fish")
                this.reel_overlay()
                this.power += graphics_state.animation_delta_time/500;
                if (this.power > 12) {
                    this.state = states.reel_in
                    this.has_bubble = false
                    this.fish = false
                }
                this.power = Math.max(this.power, 0);
                this.parameter = 1;
                break;
            case states.reel_up:
                this.clear_reel();
                this.parameter -= graphics_state.animation_delta_time/1000;
                this.parameter = Math.max(this.parameter, 0);
                if (this.parameter == 0){
                    this.state = states.hanging;
                }
                break;
            case states.hanging:
                break;
        }
    }
    draw( graphics_state, material_override )
      {
        if(!this.fishing){
            this.clear_reel();
            this.clear_windup();
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
        const MIN_LINE_LEN = 0.3;
        const BUBBLE_SIZE = 0.04;
        const FISH_SIZE = 0.2;
        const ROD_CIRC = 0.015;
        const PLAYER_HEIGHT = 0.75;
        const REST_ANGLE = Math.asin(BUBBLE_SIZE/(MIN_LINE_LEN*2));

        var rod_elevation = ROD_HEIGHT/2*Math.cos(ANGLE_C);
        for (var i = 0; i < NUM_SEG; i++){
            rod_elevation += Math.cos(ANGLE_C+(i+1)*ANGLE_B/NUM_SEG) * ROD_HEIGHT/(2*NUM_SEG);
        }
        const ROD_ELEVATION = rod_elevation/2+PLAYER_HEIGHT;
        const CAST_DIST = this.power;
        const MAX_LINE_LEN = CAST_DIST ? CAST_DIST/Math.cos(Math.atan(ROD_ELEVATION/CAST_DIST)): ROD_ELEVATION;
        const LINE_ANGLE = CAST_DIST ? Math.PI/2+Math.atan(ROD_ELEVATION/CAST_DIST)-ANGLE_C-ANGLE_B : Math.PI-ANGLE_C-ANGLE_B;
        var time = 0;
        var states = this.states;
        switch (this.state){
            case states.walking:
                return;
            case states.fishing_rest:
                break;
            case states.wind_up:
            case states.casting:
                time = this.parameter;
                break;
            case states.waiting:
            case states.reel_in:
            case states.reel_up:
            case states.reel_fish:
            case states.slack_fish:
            case states.hanging:
                time = 1200;
                break;
        }
        //Position rod in fpv
        let model_transform = Mat4.inverse(graphics_state.camera_transform);
        model_transform = model_transform.times( Mat4.translation([ 0.5, -0.3, -1.02 ]) );
        model_transform = model_transform.times( Mat4.rotation( -Math.PI/2, Vec.of( 0,1,0 ) ) );//
        // model_transform = model_transform.times( Mat4.translation([ 0.5, -0.3, -10 ]) );
        // model_transform = model_transform.times( Mat4.rotation( 0, Vec.of( 0,1,0 ) ) );//-Math.PI/2

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
          this.shapes.reel.draw( graphics_state, model_transform.times( Mat4.translation([ -ROD_CIRC*10, -ROD_HEIGHT/7, 0 ]) ).times( Mat4.scale([ ROD_CIRC*4, ROD_CIRC*3, -ROD_CIRC*4 ])).times( Mat4.rotation(Math.PI/2, Vec.of( 0,0,1 ) ) ).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0.2,0.2,0.2,1) }), material_override ));
          this.shapes.cylinder.draw( graphics_state, model_transform.times( Mat4.translation([ -ROD_CIRC*10, ROD_CIRC*3-ROD_HEIGHT/7, 0 ]) ).times( Mat4.scale([ ROD_CIRC*2, ROD_CIRC, -ROD_CIRC*2 ])).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0.8,0.8,0.8,1) }), material_override ));

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
        if(this.state == states.reel_up || this.state == states.hanging){
            scale *= this.parameter;
            scale = Math.max(MIN_LINE_LEN/2,scale);
        }
        model_transform = model_transform.times( Mat4.translation([ 0, scale, 0 ]) );
          this.shapes.cylinder.draw( graphics_state, model_transform.times( Mat4.scale([ ROD_CIRC/4, scale, ROD_CIRC/4 ])).times( Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ), this.get_material(this.plastic.override({ color: Color.of(0,0,0.2,0.2) }), material_override) );

        // Draw Bubble
        if(this.fish){
            model_transform = model_transform.times( Mat4.translation([ 0, scale + MIN_LINE_LEN/2+FISH_SIZE/2, 0 ]) );
            this.shapes.fish.draw(graphics_state, model_transform.times(Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ).times( Mat4.scale([ FISH_SIZE, FISH_SIZE, FISH_SIZE ])),this.get_material(this.fish_texture, material_override) );
        }else if(this.has_bubble){
            model_transform = model_transform.times( Mat4.translation([ 0, scale, 0 ]) );
              this.shapes.ball.draw( graphics_state, model_transform.times( Mat4.scale([ BUBBLE_SIZE, BUBBLE_SIZE, BUBBLE_SIZE ])), this.get_material(this.plastic.override({ color: Color.of(1,0,0,1)}), material_override));
            model_transform = model_transform.times( Mat4.translation([ 0, 0.01, 0 ]) );
              this.shapes.ball.draw( graphics_state, model_transform.times( Mat4.scale([ BUBBLE_SIZE, BUBBLE_SIZE, BUBBLE_SIZE ])), this.get_material(this.plastic.override({ color: Color.of(1,1,1,1)}), material_override) );
        } // this.shapes.fish.draw(graphics_state, model_transform.times(Mat4.rotation(Math.PI/2, Vec.of( 1,0,0 ) ) ).times( Mat4.scale([ FISH_SIZE, FISH_SIZE, FISH_SIZE ])),this.get_material(this.fish_texture, material_override) );
      }
    windup_overlay(){
        var canvas = document.getElementById("casting_canvas");
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFAF0";
        ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.fillStyle =  "#FF0000";
        ctx.fillRect(0,0,(this.power-2) * 100,ctx.canvas.height);
        ctx.fillRect(0,0,this.power * 20,ctx.canvas.height);
        if (this.power >= 7.2){
            var audio = document.getElementById("max_charge_sound");
            audio.play();
        }
    }
    clear_windup(){
        var canvas = document.getElementById("casting_canvas");
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    reel_overlay(){
        const BLUE = "#00FFFF"
        const RED = "#FF0000";

        var canvas = document.getElementById("reeling_canvas");
        var ctx = canvas.getContext("2d");

        var canvas_height = ctx.canvas.height
        var canvas_width = ctx.canvas.width

        const our_size = 30
        const fish_size = 20

        if (this.state == this.states.reel_fish) {
            if (this.overlay_speed < 0) {
                this.overlay_speed = 1
            }
            this.overlay_player_pos += this.overlay_speed
            this.overlay_player_pos = Math.min(canvas_height - our_size, this.overlay_player_pos)
            this.overlay_speed += 0.5
        } else {
            if (this.overlay_speed > 0) {
                this.overlay_speed = -1
            }
            this.overlay_player_pos += this.overlay_speed
            this.overlay_player_pos = Math.max(0, this.overlay_player_pos)
            this.overlay_speed -= 0.5
        }

        // TODO: add a real game
        if (true) {
            if (this.overlay_fish_speed < 0) {
                this.overlay_fish_speed = 1
            }
            this.overlay_fish_pos += this.overlay_fish_speed
            this.overlay_fish_pos = Math.min(canvas_height - fish_size, this.overlay_fish_pos)
            this.overlay_fish_speed += 0.1
        } else {
            if (this.overlay_fish_speed > 0) {
                this.overlay_fish_speed = -1
            }
            this.overlay_fish_pos += this.overlay_fish_speed
            this.overlay_fish_pos = Math.max(0, this.overlay_fish_pos)
            this.overlay_fish_speed -= 0.1
        }

        var fish_pos = this.overlay_fish_pos
        var our_pos = this.overlay_player_pos

        //fill background
        ctx.fillStyle = "#FFFAF0";
        ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

        // draw the fish
        ctx.fillStyle = BLUE
        ctx.fillRect(30, canvas_height - fish_pos - fish_size, 40, fish_size)

        //draw our bar
        ctx.fillStyle = RED
        ctx.fillRect(0, canvas_height - our_pos - our_size, 20, our_size);
        if (our_pos <= fish_pos && our_pos + our_size >= fish_pos + fish_size){
            this.winning = true
        } else {
            this.winning = false
        }
    }

    clear_reel() {
        var canvas = document.getElementById("reeling_canvas");
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
