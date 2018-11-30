window.Dock = window.classes.Dock =
class Dock extends Entity
  { constructor( context, control_box ){
        super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        const shapes = {'box': new Cube(),
                        'cylinder': new Surface_Of_Revolution(3,20, [Vec.of(0,0,1),Vec.of(0,1,1),Vec.of(0,1,-1),Vec.of(0,0,-1)], [ [ 0, 1 ], [ 0,20 ] ]),//new Cube(),               // At the beginning of our program, load one of each of these shape
                        }      // design.  Once you've told the GPU what the design of a cube is,
        this.submit_shapes( context, shapes );            // it would be redundant to tell it again.  You should just re-use
                                                        // the one called "box" more than once in display() to draw
                                                        // multiple cubes.  Don't define more than one blueprint for the
                                                        // same thing here.

                                   // Make some Material objects available to you:
        this.clay   = context.get_instance( Phong_Shader ).material( Color.of( 0,0,0, 1 ), { ambient: 0.2, diffusivity: 1, specularity: 0, texture: context.get_instance( "assets/wood.jpg", true ) } );
        let model_transform = Mat4.identity();
        this.model_transform = model_transform.times(Mat4.translation([-155,-50,60])).times(Mat4.rotation(Math.PI/2,Vec.of(0,1,0)));
    }
    update(graphics_state){

    }
    draw(graphics_state, material_override){
        let model_transform = this.model_transform;
        this.shapes.box.draw(graphics_state, model_transform.times(Mat4.scale([2.5,0.05,5])), this.get_material(this.clay, material_override));
        this.shapes.cylinder.draw(graphics_state, model_transform.times(Mat4.translation([2.5,-1.3,5])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))).times(Mat4.scale([0.25,0.25,2])), this.get_material(this.clay, material_override));
        this.shapes.cylinder.draw(graphics_state, model_transform.times(Mat4.translation([-2.5,-1.3,5])).times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0))).times(Mat4.scale([0.25,0.25,2])), this.get_material(this.clay, material_override));
    }
}
