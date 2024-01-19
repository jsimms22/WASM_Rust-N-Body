use rand::Rng;
use std::f64::consts::PI;
use std::collections::{HashMap, HashSet};
use bevy::prelude::*;
use bevy::window::WindowPlugin;
use bevy::diagnostic::{Diagnostics, FrameTimeDiagnosticsPlugin};
use bevy::render::camera::{ScalingMode, Camera2d, OrthographicCameraBundle};
use bevy_prototype_lyon::prelude::*;
use bevy_pancam::{PanCam, PanCamPlugin};
use bevy_egui::{egui, EguiContext, EguiPlugin};

use wasm_bindgen::prelude::*;

mod debug;
use debug::DebugPlugin;

struct Reset;

#[derive(Default, Clone)]
struct Stats {
    frame_counter: i32,
    elapsed_sim_time: f64,
    n_particle_total: usize,
    largest_position: Position,
}

#[derive(Clone)]
struct Settings {
    n_particles: usize,
    min_particle_mass: f64,
    max_particle_mass: f64,
    min_particle_radius: f64,
    max_particle_radius: f64,
    min_particle_orbit: f64,
    max_particle_orbit: f64,
    collisions: bool,
    center_on_largest: bool,
    dt: f64,
    g_const: f64,
}

impl Settings {
    fn default() -> Self {
        Self {
            n_particles: 1200,
            min_particle_mass: 5e+2,
            max_particle_mass: 5e+6,
            min_particle_radius: 0.5,
            max_particle_radius: 3.5,
            min_particle_orbit: 1000.0,
            max_particle_orbit: 10000.0,
            collisions: true,
            center_on_largest: false,
            dt: 3.0 as f64,
            g_const: 6.67408e-11f64,
        }
    }
}

#[derive(Component, Debug, Clone, Copy)]
struct Particle { 
    mass: f64, 
    radius: f64,
    is_center: bool, 
}

impl Particle {
    fn init_particle(mass: f64, radius: f64)  -> Particle {
        let mut rng = rand::thread_rng();
        Particle {
            mass: mass,
            radius: radius,
            is_center: false,
        }
    }
}

#[derive(Default, Component, Debug, Clone, Copy)]
struct Position{x: f64, y: f64}

impl Position {
    fn init_pos(x: f64, y: f64) -> Position {
        Position {x: x, y: y}
    }
}

#[derive(Component, Debug, Clone, Copy)]
struct Velocity{ vx: f64, vy: f64}

impl Velocity {
    fn init_vel(vx: f64, vy: f64) -> Velocity {
        Velocity {vx: vx, vy: vy}
    }
}

#[derive(Debug, Clone, Copy)]
struct Acceleration{ ax: f64, ay: f64}

impl Acceleration {
    fn init_accel(ax: f64, ay: f64) -> Acceleration {
        Acceleration { ax: ax, ay: ay}
    }
}

fn setup_initial_state(
    mut particle_query: Query<(Entity, &mut Particle)>,
    mut ev_reset: EventReader<Reset>,
    settings: Res<Settings>, 
    mut commands: Commands) 
{
    // Required for the start/restart operations to occur otherwise the game will infinitely add additional systems
    let mut manual_reset= false;

    for _ in ev_reset.iter() {
        manual_reset = true;
        if (manual_reset == true) {
            for (entity_1, particle_1) in particle_query.iter() {
                commands.entity(entity_1).despawn();
            }
        }
    }

    if manual_reset {    
        // initial instructions go here to allow the game to populate entities to the entity list 
        // or other one time events at start up

        let mut rng = rand::thread_rng();

        let center = Particle {
            mass: 5.683e+15f64,
            radius: 30.0,
            is_center: true,
        };

        spawn_particle(
            &mut commands,
            center.clone(),
            Position::init_pos(0.0f64, 0.0f64),
            Velocity::init_vel(0.0f64, 0.0f64)
        );

        for _ in 0..settings.n_particles {
            let mass = rng.gen::<f64>() * (settings.max_particle_mass - settings.min_particle_mass) + settings.min_particle_mass;
            let radius = rng.gen::<f64>() * (settings.max_particle_radius - settings.min_particle_radius) + settings.min_particle_radius;
            let orbit_radius: f64 = rng.gen::<f64>() * (settings.max_particle_orbit - settings.min_particle_orbit) + settings.min_particle_orbit;
            let radian: f64 = rng.gen::<f64>() * 2.0 * PI;
            let x: f64 = orbit_radius * radian.cos();
            let y: f64 = orbit_radius * radian.sin();
            let orbital_velocity = (settings.g_const * center.mass / orbit_radius).sqrt();
            let vx: f64 = -orbital_velocity * radian.sin();
            let vy: f64 = orbital_velocity * radian.cos();
            spawn_particle(
                &mut commands, 
                Particle::init_particle(mass, radius),
                Position::init_pos(x,y),
                Velocity::init_vel(vx,vy)
            );
        }
    }
}

fn spawn_particle(
    commands: &mut Commands, 
    particle: Particle, 
    position: Position, 
    velocity: Velocity) 
{
    let shape = shapes::Circle {
        radius: particle.radius as f32,
        center: Vec2::ZERO
    };

    let mut entity_commands = commands.spawn_bundle(GeometryBuilder::build_as(
        &shape,
        DrawMode::Outlined{
            fill_mode: FillMode::color(Color::WHITE),
            outline_mode: StrokeMode::new(Color::WHITE, 10.0),
        },
        Transform {
            translation: Vec3::new(position.x as f32, position.y as f32, 10.0),
            ..Default::default()
        },
    ));

    entity_commands
        .insert(particle)
        .insert(position)
        .insert(velocity);
}

fn radius_to_volume(r: f64) -> f64 {
    4.0 / 3.0 * PI * r.powf(3.0)
}

fn volume_to_radius(v: f64) -> f64 {
    ((3.0 * v) / (4.0 * PI)).powf(1.0 / 3.0)
}

fn merge_particles(particle_1: Particle, particle_2: Particle) -> Particle {
    let mass_sum: f64 = particle_1.mass + particle_2.mass;
    let volume_1: f64 = radius_to_volume(particle_1.radius);
    let volume_2: f64 = radius_to_volume(particle_2.radius);
    Particle::init_particle(mass_sum, volume_to_radius(volume_1 + volume_2))
}

fn r_vector_calc(
    particle_1: Position,
    particle_2: Position ) -> f64
{
    ((particle_2.x - particle_1.x).powf(2.0) + (particle_2.y - particle_1.y).powf(2.0)).sqrt()
}

fn gravitational_force(
    particle_1_pos: f64,
    particle_2_pos: f64,
    r_vec: f64,
    particle_2_mass: f64,
    g: f64) -> f64
{
    (g * particle_2_mass * (particle_2_pos - particle_1_pos)) / r_vec.powf(3.0)
}

fn collision(
    commands: &mut Commands,
    particle_1: Particle,
    particle_2: Particle,
    position_1: Position,
    position_2: Position,
    velocity_1: Velocity,
    velocity_2: Velocity
) {
    let mass_sum = particle_1.mass + particle_2.mass;
    let mut collision_vel = Velocity::init_vel(0.0f64,0.0f64);

    collision_vel.vx = ((particle_1.mass * velocity_1.vx) + (particle_2.mass * velocity_2.vx)) / mass_sum;
    collision_vel.vy = ((particle_1.mass * velocity_1.vy) + (particle_2.mass * velocity_2.vy)) / mass_sum;

    let mut collision_pos = Position::init_pos(0.0f64,0.0f64);

    collision_pos.x = (position_1.x + position_2.x) / 2.0f64;
    collision_pos.y = (position_1.y + position_2.y) / 2.0f64;

    spawn_particle(
        commands,
        merge_particles(particle_1, particle_2),
        collision_pos,
        collision_vel
    );
}

fn verlet(
    mut particle_query: Query<(Entity, &mut Particle, &mut Position, &mut Velocity, &mut Transform)>, 
    mut ev_reset: EventReader<Reset>, 
    settings: Res<Settings>,
    mut commands: Commands,
    mut stats: ResMut<Stats>,
    time: Res<Time>) 
{
    // instructions go here to allow the game to manipulate entities to the entity list 
    // or other events during runtime
    // it might be best to comparmentalize some instructions to their own fn for modularity
    let mut largest = 0.0;
    stats.n_particle_total = 0;
    stats.frame_counter += 1;
    //println!("frame count: {}",stats.frame_counter);

    let mut accel_map: HashMap<u32, Acceleration> = HashMap::new();
    let mut despawned: HashSet<u32> = HashSet::new();

    // perform niave euler integration
    for (entity_1, particle_1, position_1, velocity_1, transform_1) in particle_query.iter() {
        if particle_1.radius > largest && !particle_1.is_center {
            largest = particle_1.radius;
            stats.largest_position = *position_1;
        }
        let mut accel_total = Acceleration::init_accel(0.0f64,0.0f64);
        stats.n_particle_total += 1;
        for (entity_2, particle_2, position_2, velocity_2, transform_2) in particle_query.iter() {
            if entity_1.id() != entity_2.id()
                && !despawned.contains(&entity_1.id())
                && !despawned.contains(&entity_2.id())
            {
                let r_vec = r_vector_calc(*position_1, *position_2);
                if r_vec <= (particle_1.radius + particle_2.radius) && settings.collisions == true{
                    commands.entity(entity_2).despawn();
                    despawned.insert(entity_2.id());
                    commands.entity(entity_1).despawn();
                    despawned.insert(entity_1.id());

                    collision(&mut commands, *particle_1, *particle_2, *position_1, *position_2, *velocity_1, *velocity_2);
                } else {
                    let r_vec = r_vector_calc(*position_1, *position_2);
                    accel_total.ax += gravitational_force(position_1.x, position_2.x, r_vec, particle_2.mass, settings.g_const);
                    accel_total.ay += gravitational_force(position_1.y, position_2.y, r_vec, particle_2.mass, settings.g_const);
                }
            }
        }
        accel_map.insert(entity_1.id(), accel_total);
    }

    for (entity_1, particle_1, mut position_1, mut velocity_1, mut transform_1) in particle_query.iter_mut() {
        let mut accel_temp = Acceleration::init_accel(0.0f64,0.0f64);
        if !despawned.contains(&entity_1.id()) {
            accel_temp = *accel_map.get(&entity_1.id()).unwrap();
            velocity_1.vx += accel_temp.ax * settings.dt; 
            velocity_1.vy += accel_temp.ay * settings.dt;
            position_1.x += velocity_1.vx * settings.dt;
            position_1.y += velocity_1.vy * settings.dt;
            transform_1.translation.x = position_1.x as f32;
            transform_1.translation.y = position_1.y as f32;
            /*
            if entity_1.id() == 1 {
                println!{"particle {} acceleration: {}, {}", entity_1.id(), accel_temp.ax, accel_temp.ay};
                println!{"particle {} velocity: {}, {}", entity_1.id(), velocity_1.vx, velocity_1.vy};
                println!{"particle {} position: {}, {}", entity_1.id(), position_1.x, position_1.y};
            }
            */
        }
    }
    //stats.elapsed_sim_time = settings.dt * (stats.frame_counter as f64);
    //println!("elapsed simulation time: {} seconds",stats.elapsed_sim_time);
}

fn spawn_camera(
    mut commands: Commands, 
    mut ev_reset: EventWriter<Reset>) 
{   
    commands
        .spawn_bundle(OrthographicCameraBundle::new_2d())
        .insert(PanCam::default());

    // This line will allow the system to start immediately
    //ev_reset.send(Reset);
}

fn move_camera(
    mut camera: Query<&mut Transform, With<Camera>>, 
    stats: Res<Stats>, 
    settings: Res<Settings>) 
{
    for mut transform in camera.iter_mut() {
        if settings.center_on_largest {
            transform.translation.x = stats.largest_position.x as f32;
            transform.translation.y = stats.largest_position.y as f32;
        }
    }
}

fn ui_box(
    mut settings: ResMut<Settings>,
    mut ev_reset: EventWriter<Reset>,
    mut egui_context: ResMut<EguiContext>,
    diagnostics: Res<Diagnostics>,
    time: Res<Time>,
    stats: Res<Stats>)
{
    egui::Window::new("Particle Observer".to_string()).show(egui_context.ctx_mut(), |ui| {
        if let Some(fps) = diagnostics.get(FrameTimeDiagnosticsPlugin::FPS) {
            if let Some(average) = fps.average() {
                if ui.button("Start").clicked() {
                    ev_reset.send(Reset);
                }
                ui.label(" ");
                ui.label("Drag to move,\nscroll wheel to zoom in/out.");
                ui.label(" ");
                ui.label(format!("Time {:.2}", time.seconds_since_startup()));
                ui.label(format!("FPS {:.2}", average));
                ui.label(" ");
                ui.label(format!("Number of objects {:}", stats.n_particle_total));
                ui.label(" ");
                ui.add(egui::Slider::new(&mut settings.n_particles, 10..=1000).text("Particles"));
                ui.label(" ");
                ui.add(egui::Slider::new(&mut settings.min_particle_orbit, 100f64..=950f64).text("Minimum Orbit Radius"));
                ui.label(" ");
                ui.add(egui::Slider::new(&mut settings.max_particle_orbit, 1050f64..=5000f64).text("Maximum Orbit Radius"));
                ui.label(" ");
                ui.add(egui::Slider::new(&mut settings.dt, 1.0..=5.0).text("Time Step"));
                ui.label("Lower value means smaller steps through \ntime, but more precise simulation.");
                ui.label(" ");
                ui.checkbox(&mut settings.collisions, "Enable colissions");
                ui.checkbox(&mut settings.center_on_largest, "Center on the largest");
            }
        }
    });
}

#[wasm_bindgen]
pub fn game() {
    #[cfg(not(debug_assertions))]
    {
        App::new()
            .insert_resource(Msaa { samples: 4 })
            .insert_resource(ClearColor(Color::BLACK))
            .insert_resource(Settings::default())
            .add_event::<Reset>()
            .add_plugins(DefaultPlugins)
            .add_plugin(FrameTimeDiagnosticsPlugin::default())
            .add_plugin(EguiPlugin) 
            .add_plugin(ShapePlugin)
            .add_plugin(PanCamPlugin::default())
            //.add_plugin(bevy_web_resizer::Plugin)
            .add_startup_system(spawn_camera)
            .add_system(verlet)
            .add_system(ui_box)
            .add_system(move_camera)
            .add_system(setup_initial_state)
            .insert_resource(Stats::default())
            .run();
    }
    #[cfg(debug_assertions)]
    {
        App::new()
            .insert_resource(Msaa { samples: 4 })
            .insert_resource(ClearColor(Color::BLACK))
            .insert_resource(Settings::default())
            .add_event::<Reset>()
            .add_plugins(DefaultPlugins)
            .add_plugin(FrameTimeDiagnosticsPlugin::default())
            //.add_plugin(DebugPlugin)
            .add_plugin(EguiPlugin) 
            .add_plugin(ShapePlugin)
            .add_plugin(PanCamPlugin::default())
            //.add_plugin(bevy_web_resizer::Plugin)
            .add_startup_system(spawn_camera)
            .add_system(verlet)
            .add_system(ui_box)
            .add_system(move_camera)
            .add_system(setup_initial_state)
            .insert_resource(Stats::default())
            .run();
    }
}

pub fn main() { game(); }