window.FR = window.classes.FR =
class FR extends Entity
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:

        const shapes = { 'box': new Cube(),               // At the beginning of our program, load one of each of these shape
                        'ball': new Subdivision_Sphere(4)}      // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                          // the one called "box" more than once in display() to draw
                                                          // multiple cubes.  Don't define more than one blueprint for the
                                                          // same thing here.

                                     // Make some Material objects available to you:
        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( .9,.5,.9, 1 ), { ambient: .4, diffusivity: .4 } );
        this.plastic = this.clay.override({ specularity: .6 });

        this.lights = [ new Light( Vec.of( 0,5,5,1 ), Color.of( 1, .4, 1, 1 ), 100000 ) ];
        this.num_cubes = 8;
        this.rotation = 0;
        this.outline = false;
        this.sway = true;
        this.set_colors();
      }
    set_colors() {
        this.colors = [];
        for(var i = 0; i < this.num_cubes; i++){
            this.colors.push(Color.of(0.6,0.4,0.2,1));
        }
        this.cube_num = 0;
      }
      update(){

      }
    draw_box( graphics_state, model_transform )
      {
        const BOX_HEIGHT = 2*0.5;
        const BOX_WIDTH = 0.4;
        const MAX_ANGLE = 0.18*Math.PI;
        var time = graphics_state.animation_time % 5000;
        if (time > 3000) {
            time = 3000;
        }
        if(this.sway & !this.cube_num){
            this.rotation = /*MAX_ANGLE/2+*/MAX_ANGLE/2*Math.sin(0.00157079*time);
        }else{
            this.rotation = 0;
        }
        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT, 0 ]) );
        model_transform = model_transform.times( Mat4.translation([ 0, -BOX_HEIGHT/2, 0 ]) );
        model_transform = model_transform.times( Mat4.rotation( -this.rotation, Vec.of( 0,0,1 ) ) );
        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT/2, 0 ]) );
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        if(this.outline && this.cube_num){
            this.shapes.outline.draw(graphics_state, model_transform.times( Mat4.scale([ 2, 0.6, 2 ])),this.white,"LINES");
        }else{
            this.shapes.box.draw( graphics_state, model_transform.times( Mat4.scale([ 0.2, 0.6, 0.2 ])), this.plastic.override({ color: this.colors[this.cube_num] }) );
        }

        this.cube_num = (this.cube_num + 1) % this.num_cubes;
        return model_transform;
      }
    draw_top( graphics_state, model_transform){
        const BOX_HEIGHT = 2*0.5;
        const BOX_WIDTH = 0.4;
        const MAX_ANGLE = 0.04*Math.PI;
        var time = graphics_state.animation_time % 5000;
        if (time > 3000) {
            time = 3000;
        }
        if(this.sway){
            this.rotation = /*MAX_ANGLE/2+*/MAX_ANGLE/2*Math.sin(0.00157079*time);
        }else{
            this.rotation = 0;
        }
        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT, 0 ]) );
        model_transform = model_transform.times( Mat4.translation([ 0, -BOX_HEIGHT/2, 0 ]) );
        model_transform = model_transform.times( Mat4.rotation( -this.rotation, Vec.of( 0,0,1 ) ) );
        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT/2, 0 ]) );
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        if(this.outline && this.cube_num){
            this.shapes.outline.draw(graphics_state, model_transform.times( Mat4.scale([ 2, 0.6, 2 ])),this.white,"LINES");
        }else{
            this.shapes.box.draw( graphics_state, model_transform.times( Mat4.scale([ 0.2, 0.6, 0.2 ])), this.plastic.override({ color: this.colors[this.cube_num] }) );
        }

        // this.cube_num = (this.cube_num + 1) % this.num_cubes;
        return model_transform;
    }
    draw_line( graphics_state, model_transform){
        const BOX_HEIGHT = 2*0.5;
        const BOX_WIDTH = 0.4;
        const MAX_ANGLE = 2*Math.PI;
        var time = graphics_state.animation_time % 5000-this.line_num*500;
        if (time < 0) {
            time = 0;
        }
        if (time > 3200) {
            time = 3200;
        }

        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT, 0 ]) );
        model_transform = model_transform.times( Mat4.translation([ 0, -BOX_HEIGHT/2, 0 ]) );
        if(!this.line_num){
            model_transform = model_transform.times( Mat4.rotation( Math.PI+(2*Math.PI)/5000*time, Vec.of( 0,0,1 ) ) );
        }
        model_transform = model_transform.times( Mat4.translation([ 0, BOX_HEIGHT/2, 0 ]) );
        // TODO:  Helper function for requirement 3 (see hint).
        //        This should make changes to the model_transform matrix, draw the next box, and return the newest model_transform.
        if(this.outline && this.cube_num){
            this.shapes.outline.draw(graphics_state, model_transform.times( Mat4.scale([ 2, 0.6, 2 ])),this.white,"LINES");
        }else{
            this.shapes.box.draw( graphics_state, model_transform.times( Mat4.scale([ 0.05, 0.6, 0.05 ])), this.plastic.override({ color: this.colors[this.cube_num] }));
        }
        this.line_num +=1;

        //this.cube_num = (this.cube_num + 1) % this.num_cubes;
        return model_transform;
    }
    draw( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.

        let model_transform = Mat4.inverse(graphics_state.camera_transform);
        model_transform = model_transform.times( Mat4.translation([ 5, -10, -15 ]) );
        model_transform = model_transform.times( Mat4.rotation( -Math.PI/2.2, Vec.of( 0,1,0 ) ) );
        // TODO:  Draw your entire scene here.  Use this.draw_box( graphics_state, model_transform ) to call your helper.
        const NUM_CUBES = this.num_cubes;
        for(var i = 0; i < NUM_CUBES; i++){
            model_transform = this.draw_box(graphics_state, model_transform);
        }
        for(var i = 0; i < NUM_CUBES; i++){
            model_transform = this.draw_top(graphics_state, model_transform);
        }
        this.line_num = 0;
        var num_pieces = (graphics_state.animation_time % 5000)/100 > 10 ? ((graphics_state.animation_time % 5000)/25 < 100 ? (graphics_state.animation_time % 5000)/25 : 100) : 20;
        for(var i = 0; i < num_pieces-10; i++){
            model_transform = this.draw_line(graphics_state, model_transform);
        }
        this.shapes.ball.draw( graphics_state, model_transform, this.plastic.override({ color: this.colors[this.cube_num] }) );
      }
  }
