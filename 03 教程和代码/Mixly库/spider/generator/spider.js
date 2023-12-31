'use strict';

goog.provide('Blockly.Arduino.spider');

goog.require('Blockly.Arduino');



Blockly.Arduino.START = function (block) {
	const usp = block.getFieldValue('USP');
	Blockly.Arduino.definitions_.define_start=`#include <ESP32_Servo.h>
	#define Addr 0x1C
	#define SDA 18
	#define SCL 19
	
	/* Servos --------------------------------------------------------------------*/
	//define 12 servos for 4 legs
	Servo servo[4][3];
	//define servos' ports
	const int servo_pin[4][3] = { {18, 5, 19}, {2, 4, 15}, {33, 25, 32}, {26, 14, 13} };
	const int offset[4][3] =    {{ 0, 0, 0}, { 0,  0,  0}, { 0,  0,  0}, { 0,  0, 0}};
	/* Size of the robot ---------------------------------------------------------*/
	const float length_a = 55;
	const float length_b = 77.5;
	const float length_c = 27.5;
	const float length_side = 71;
	const float z_absolute = -28;
	/* Constants for movement ----------------------------------------------------*/
	const float z_default = -50, z_up = -30, z_boot = z_absolute;
	const float x_default = 62, x_offset = 0;
	const float y_start = 0, y_step = 40;
	const float y_default = x_default;
	/* variables for movement ----------------------------------------------------*/
	volatile float site_now[4][3];    //real-time coordinates of the end of each leg
	volatile float site_expect[4][3]; //expected coordinates of the end of each leg
	float temp_speed[4][3];   //each axis' speed, needs to be recalculated before each movement
	float move_speed;     //movement speed
	float speed_multiple = 1; //movement speed multiple
	const float spot_turn_speed = 4;
	const float leg_move_speed = 8;
	const float body_move_speed = 3;
	const float stand_seat_speed = 1;
	volatile int rest_counter;      //+1/0.02s, for automatic rest
	//functions' parameter
	const float KEEP = 255;
	//define PI for calculation
	const float pi = 3.1415926;
	/* Constants for turn --------------------------------------------------------*/
	//temp length
	const float temp_a = sqrt(pow(2 * x_default + length_side, 2) + pow(y_step, 2));
	const float temp_b = 2 * (y_start + y_step) + length_side;
	const float temp_c = sqrt(pow(2 * x_default + length_side, 2) + pow(2 * y_start + y_step + length_side, 2));
	const float temp_alpha = acos((pow(temp_a, 2) + pow(temp_b, 2) - pow(temp_c, 2)) / 2 / temp_a / temp_b);
	//site for turn
	const float turn_x1 = (temp_a - length_side) / 2;
	const float turn_y1 = y_start + y_step / 2;
	const float turn_x0 = turn_x1 - temp_b * cos(temp_alpha);
	const float turn_y0 = temp_b * sin(temp_alpha) - turn_y1 - length_side;
	
	static uint32_t currentTime = 0;
	static uint16_t previousTime = 0;
	uint16_t cycleTime = 0;
	
	 int act = 1;
	 char val;
	
	 String header;
	 void Task2code( void *pvParameters );
	 
	 void servo_attach(void)
{
  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 3; j++)
    {
      servo[i][j].attach(servo_pin[i][j], 500, 2500);
      delay(100);
    }
  }
}

void servo_detach(void)
{
  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 3; j++)
    {
      servo[i][j].detach();
      delay(100);
    }
  }
}

void Task2(void *pvParameters) 
{
  while(1)
  {
    vTaskDelay(15);
    servo_service();
  }
}


/*
  - sit
  - blocking function
   ---------------------------------------------------------------------------*/
void sit(void)
{
	move_speed = stand_seat_speed;
	for (int leg = 0; leg < 4; leg++)
	{
		set_site(leg, KEEP, KEEP, z_boot);
	}
	wait_all_reach();
}

/*
  - stand
  - blocking function
   ---------------------------------------------------------------------------*/
void stand(void)
{
	move_speed = stand_seat_speed;
	for (int leg = 0; leg < 4; leg++)
	{
		set_site(leg, KEEP, KEEP, z_default);
	}
	wait_all_reach();
}


/*
  - spot turn to left
  - blocking function
  - parameter step steps wanted to turn
   ---------------------------------------------------------------------------*/
void turn_left(unsigned int step)
{
	move_speed = spot_turn_speed;
	while (step-- > 0)
	{
		if (site_now[3][1] == y_start)
		{
			//leg 3&1 move
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x1 - x_offset, turn_y1, z_default);
			set_site(1, turn_x0 - x_offset, turn_y0, z_default);
			set_site(2, turn_x1 + x_offset, turn_y1, z_default);
			set_site(3, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(3, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x1 + x_offset, turn_y1, z_default);
			set_site(1, turn_x0 + x_offset, turn_y0, z_default);
			set_site(2, turn_x1 - x_offset, turn_y1, z_default);
			set_site(3, turn_x0 - x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(1, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_default);
			set_site(1, x_default + x_offset, y_start, z_up);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			set_site(1, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 0&2 move
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_up);
			set_site(1, turn_x1 + x_offset, turn_y1, z_default);
			set_site(2, turn_x0 - x_offset, turn_y0, z_default);
			set_site(3, turn_x1 - x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x0 - x_offset, turn_y0, z_default);
			set_site(1, turn_x1 - x_offset, turn_y1, z_default);
			set_site(2, turn_x0 + x_offset, turn_y0, z_default);
			set_site(3, turn_x1 + x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(2, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_up);
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();

			set_site(2, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - spot turn to right
  - blocking function
  - parameter step steps wanted to turn
   ---------------------------------------------------------------------------*/
void turn_right(unsigned int step)
{
	move_speed = spot_turn_speed;
	while (step-- > 0)
	{
		if (site_now[2][1] == y_start)
		{
			//leg 2&0 move
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x0 - x_offset, turn_y0, z_default);
			set_site(1, turn_x1 - x_offset, turn_y1, z_default);
			set_site(2, turn_x0 + x_offset, turn_y0, z_up);
			set_site(3, turn_x1 + x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(2, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_default);
			set_site(1, turn_x1 + x_offset, turn_y1, z_default);
			set_site(2, turn_x0 - x_offset, turn_y0, z_default);
			set_site(3, turn_x1 - x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_up);
			set_site(1, x_default + x_offset, y_start, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 1&3 move
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x1 + x_offset, turn_y1, z_default);
			set_site(1, turn_x0 + x_offset, turn_y0, z_up);
			set_site(2, turn_x1 - x_offset, turn_y1, z_default);
			set_site(3, turn_x0 - x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(1, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x1 - x_offset, turn_y1, z_default);
			set_site(1, turn_x0 - x_offset, turn_y0, z_default);
			set_site(2, turn_x1 + x_offset, turn_y1, z_default);
			set_site(3, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(3, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_default);
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - go forward
  - blocking function
  - parameter step steps wanted to go
   ---------------------------------------------------------------------------*/
void step_forward(unsigned int step)
{
	move_speed = leg_move_speed;
	 while (step-- > 0)
	{
    Serial.println(step);
		if (site_now[2][1] == y_start)
		{
			//leg 2&1 move
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default + x_offset, y_start, z_default);
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 0&3 move
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_default);
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - go back
  - blocking function
  - parameter step steps wanted to go
   ---------------------------------------------------------------------------*/
void step_back(unsigned int step)
{
	move_speed = leg_move_speed;
	while (step-- > 0)
	{
		if (site_now[3][1] == y_start)
		{
			//leg 3&0 move
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(1, x_default + x_offset, y_start, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 1&2 move
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

// add by RegisHsu

void body_left(int i)
{
	set_site(0, site_now[0][0] + i, KEEP, KEEP);
	set_site(1, site_now[1][0] + i, KEEP, KEEP);
	set_site(2, site_now[2][0] - i, KEEP, KEEP);
	set_site(3, site_now[3][0] - i, KEEP, KEEP);
	wait_all_reach();
}

void body_right(int i)
{
	set_site(0, site_now[0][0] - i, KEEP, KEEP);
	set_site(1, site_now[1][0] - i, KEEP, KEEP);
	set_site(2, site_now[2][0] + i, KEEP, KEEP);
	set_site(3, site_now[3][0] + i, KEEP, KEEP);
	wait_all_reach();
}

void hand_wave(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	move_speed = 1;
	if (site_now[3][1] == y_start)
	{
		body_right(15);
		x_tmp = site_now[2][0];
		y_tmp = site_now[2][1];
		z_tmp = site_now[2][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(2, turn_x1, turn_y1, 50);
			wait_all_reach();
			set_site(2, turn_x0, turn_y0, 50);
			wait_all_reach();
		}
		set_site(2, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_left(15);
	}
	else
	{
		body_left(15);
		x_tmp = site_now[0][0];
		y_tmp = site_now[0][1];
		z_tmp = site_now[0][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(0, turn_x1, turn_y1, 50);
			wait_all_reach();
			set_site(0, turn_x0, turn_y0, 50);
			wait_all_reach();
		}
		set_site(0, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_right(15);
	}
}

void hand_shake(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	move_speed = 1;
	if (site_now[3][1] == y_start)
	{
		body_right(15);
		x_tmp = site_now[2][0];
		y_tmp = site_now[2][1];
		z_tmp = site_now[2][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(2, x_default - 30, y_start + 2 * y_step, 55);
			wait_all_reach();
			set_site(2, x_default - 30, y_start + 2 * y_step, 10);
			wait_all_reach();
		}
		set_site(2, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_left(15);
	}
	else
	{
		body_left(15);
		x_tmp = site_now[0][0];
		y_tmp = site_now[0][1];
		z_tmp = site_now[0][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(0, x_default - 30, y_start + 2 * y_step, 55);
			wait_all_reach();
			set_site(0, x_default - 30, y_start + 2 * y_step, 10);
			wait_all_reach();
		}
		set_site(0, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_right(15);
	}
}

void head_up(int i)
{
	set_site(0, KEEP, KEEP, site_now[0][2] - i);
	set_site(1, KEEP, KEEP, site_now[1][2] + i);
	set_site(2, KEEP, KEEP, site_now[2][2] - i);
	set_site(3, KEEP, KEEP, site_now[3][2] + i);
	wait_all_reach();
}

void head_down(int i)
{
	set_site(0, KEEP, KEEP, site_now[0][2] + i);
	set_site(1, KEEP, KEEP, site_now[1][2] - i);
	set_site(2, KEEP, KEEP, site_now[2][2] + i);
	set_site(3, KEEP, KEEP, site_now[3][2] - i);
	wait_all_reach();
}

void body_dance(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	float body_dance_speed = 2;
	sit();
	move_speed = 1;
	set_site(0, x_default, y_default, KEEP);
	set_site(1, x_default, y_default, KEEP);
	set_site(2, x_default, y_default, KEEP);
	set_site(3, x_default, y_default, KEEP);
	wait_all_reach();
	//stand();
	set_site(0, x_default, y_default, z_default - 20);
	set_site(1, x_default, y_default, z_default - 20);
	set_site(2, x_default, y_default, z_default - 20);
	set_site(3, x_default, y_default, z_default - 20);
	wait_all_reach();
	move_speed = body_dance_speed;
	head_up(30);
	for (int j = 0; j < i; j++)
	{
		if (j > i / 4)
			move_speed = body_dance_speed * 2;
		if (j > i / 2)
			move_speed = body_dance_speed * 3;
		set_site(0, KEEP, y_default - 20, KEEP);
		set_site(1, KEEP, y_default + 20, KEEP);
		set_site(2, KEEP, y_default - 20, KEEP);
		set_site(3, KEEP, y_default + 20, KEEP);
		wait_all_reach();
		set_site(0, KEEP, y_default + 20, KEEP);
		set_site(1, KEEP, y_default - 20, KEEP);
		set_site(2, KEEP, y_default + 20, KEEP);
		set_site(3, KEEP, y_default - 20, KEEP);
		wait_all_reach();
	}
	move_speed = body_dance_speed;
	head_down(30);
}


/*
  - microservos service /timer interrupt function/50Hz
  - when set site expected,this function move the end point to it in a straight line
  - temp_speed[4][3] should be set before set expect site,it make sure the end point
   move in a straight line,and decide move speed.
   ---------------------------------------------------------------------------*/
void servo_service(void)
{
//	sei();
	static float alpha, beta, gamma;

	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			if (abs(site_now[i][j] - site_expect[i][j]) >= abs(temp_speed[i][j]))
				site_now[i][j] += temp_speed[i][j];
			else
				site_now[i][j] = site_expect[i][j];
		}

		cartesian_to_polar(alpha, beta, gamma, site_now[i][0], site_now[i][1], site_now[i][2]);
		polar_to_servo(i, alpha, beta, gamma);
	}

	rest_counter++;
}

/*
  - set one of end points' expect site
  - this founction will set temp_speed[4][3] at same time
  - non - blocking function
   ---------------------------------------------------------------------------*/
void set_site(int leg, float x, float y, float z)
{
	float length_x = 0, length_y = 0, length_z = 0;

	if (x != KEEP)
		length_x = x - site_now[leg][0];
	if (y != KEEP)
		length_y = y - site_now[leg][1];
	if (z != KEEP)
		length_z = z - site_now[leg][2];

	float length = sqrt(pow(length_x, 2) + pow(length_y, 2) + pow(length_z, 2));

	temp_speed[leg][0] = length_x / length * move_speed * speed_multiple;
	temp_speed[leg][1] = length_y / length * move_speed * speed_multiple;
	temp_speed[leg][2] = length_z / length * move_speed * speed_multiple;

	if (x != KEEP)
	site_expect[leg][0] = x;
	if (y != KEEP)
	site_expect[leg][1] = y;
	if (z != KEEP)
	site_expect[leg][2] = z;
}

/*
  - wait one of end points move to expect site
  - blocking function
   ---------------------------------------------------------------------------*/
void wait_reach(int leg)
{
    while (1)
    {
	      if (site_now[leg][0] == site_expect[leg][0])
		        if (site_now[leg][1] == site_expect[leg][1])
			          if (site_now[leg][2] == site_expect[leg][2])
				            break;
 
        vTaskDelay(1);
    }
}

/*
  - wait all of end points move to expect site
  - blocking function
   ---------------------------------------------------------------------------*/
void wait_all_reach(void)
{
	for (int i = 0; i < 4; i++)
		wait_reach(i);
}

/*
  - trans site from cartesian to polar
  - mathematical model 2/2
   ---------------------------------------------------------------------------*/
void cartesian_to_polar(volatile float &alpha, volatile float &beta, volatile float &gamma, volatile float x, volatile float y, volatile float z)
{
	//calculate w-z degree
	float v, w;
	w = (x >= 0 ? 1 : -1) * (sqrt(pow(x, 2) + pow(y, 2)));
	v = w - length_c;
	alpha = atan2(z, v) + acos((pow(length_a, 2) - pow(length_b, 2) + pow(v, 2) + pow(z, 2)) / 2 / length_a / sqrt(pow(v, 2) + pow(z, 2)));
	beta = acos((pow(length_a, 2) + pow(length_b, 2) - pow(v, 2) - pow(z, 2)) / 2 / length_a / length_b);
	//calculate x-y-z degree
	gamma = (w >= 0) ? atan2(y, x) : atan2(-y, -x);
	//trans degree pi->180
	alpha = alpha / pi * 180;
	beta = beta / pi * 180;
	gamma = gamma / pi * 180;
}

/*
  - trans site from polar to microservos
  - mathematical model map to fact
  - the errors saved in eeprom will be add
   ---------------------------------------------------------------------------*/
void polar_to_servo(int leg, float alpha, float beta, float gamma)
{
	if (leg == 0)
	{
		alpha = 90 - alpha;
		beta = beta;
		 gamma += 90;
//		gamma = 90 - gamma;
	}
	else if (leg == 1)
	{
		alpha += 90;
		beta = 180 - beta;
		 gamma = 90 - gamma;
//		gamma += 90;
	}
	else if (leg == 2)
	{
		alpha += 90;
		beta = 180 - beta;
		 gamma = 90 - gamma;
//		gamma += 90;
	}
	else if (leg == 3)
	{
		alpha = 90 - alpha;
		beta = beta;
		 gamma += 90;
//		gamma = 90 - gamma;
	}

	servo[leg][0].write(alpha+offset[leg][0]);
	servo[leg][1].write(beta+offset[leg][1]);
	servo[leg][2].write(gamma+offset[leg][2]);
}
`;
	Blockly.Arduino.setups_.uspf = `  Serial.begin(9600);
	Serial.println("Robot starts initialization");
	//initialize default parameter
	set_site(0, x_default - x_offset, y_start + y_step, z_boot);
	set_site(1, x_default - x_offset, y_start + y_step, z_boot);
	set_site(2, x_default + x_offset, y_start, z_boot);
	set_site(3, x_default + x_offset, y_start, z_boot);
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			site_now[i][j] = site_expect[i][j];
		}
	}
	//start servo service
	Serial.println("Servo service started");
	//initialize servos
	servo_attach();
	Serial.println("Servos initialized");
	Serial.println("Robot initialization Complete");


 //最后一个参数至关重要，决定这个任务创建在哪个核上.PRO_CPU 为 0, APP_CPU 为 1,或者 tskNO_AFFINITY 允许任务在两者上运行.
   xTaskCreatePinnedToCore(Task2, "Task2", 10000, NULL, 1, NULL,  1);`;
	return ` vTaskDelay(100);\n`;
};
Blockly.Arduino.FOR = function (block) {
	return `step_forward(5);\n`;
};
Blockly.Arduino.BACK = function (block) {
	return `step_back(5);\n`;
};
Blockly.Arduino.LEFT = function (block) {
	return `turn_left(5);\n`;
};
Blockly.Arduino.RIGHT = function (block) {
	return `turn_right(5);\n`;
};
Blockly.Arduino.WAVE = function (block) {
	return `hand_wave(3);\n`;
};
Blockly.Arduino.SHAKE = function (block) {
	return `hand_shake(3);\n`;
};
Blockly.Arduino.DANCE = function (block) {
	return `body_dance(10);\n`;
};
Blockly.Arduino.SIT = function (block) {
	return `sit();\n`;
};
Blockly.Arduino.STAND = function (block) {
	return `stand();\n`;
};
Blockly.Arduino.APP = function (block) {
	Blockly.Arduino.definitions_.define_umobs =`#include <soc/soc.h> 
	#include <soc/rtc_cntl_reg.h>
	#include <soc/rtc_wdt.h> //设置看门狗用
	#include <Wire.h>
	#include <WiFi.h>
	#include <WiFiClient.h>
	#include <WiFiAP.h>
	#include <ESP32_Servo.h>
	//#include <BluetoothSerial.h>
	
	/* Servos --------------------------------------------------------------------*/
	//define 12 servos for 4 legs
	Servo servo[4][3];
	//define servos' ports
	// const int servo_pin[4][3] = { {2, 3, 4}, {5, 6, 7}, {8, 9, 10}, {11, 12, 13} };
	const int servo_pin[4][3] = { {18, 5, 19}, {2, 4, 15}, {33, 25, 32}, {26, 14, 13} };
	const int offset[4][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
	/* Size of the robot ---------------------------------------------------------*/
	const float length_a = 55;
	const float length_b = 77.5;
	const float length_c = 27.5;
	const float length_side = 71;
	const float z_absolute = -28;
	/* Constants for movement ----------------------------------------------------*/
	const float z_default = -50, z_up = -30, z_boot = z_absolute;
	const float x_default = 62, x_offset = 0;
	const float y_start = 0, y_step = 40;
	const float y_default = x_default;
	/* variables for movement ----------------------------------------------------*/
	volatile float site_now[4][3];    //real-time coordinates of the end of each leg
	volatile float site_expect[4][3]; //expected coordinates of the end of each leg
	float temp_speed[4][3];   //each axis' speed, needs to be recalculated before each movement
	float move_speed;     //movement speed
	float speed_multiple = 1; //movement speed multiple
	const float spot_turn_speed = 4;
	const float leg_move_speed = 8;
	const float body_move_speed = 3;
	const float stand_seat_speed = 1;
	volatile int rest_counter;      //+1/0.02s, for automatic rest
	//functions' parameter
	const float KEEP = 255;
	//define PI for calculation
	const float pi = 3.1415926;
	/* Constants for turn --------------------------------------------------------*/
	//temp length
	const float temp_a = sqrt(pow(2 * x_default + length_side, 2) + pow(y_step, 2));
	const float temp_b = 2 * (y_start + y_step) + length_side;
	const float temp_c = sqrt(pow(2 * x_default + length_side, 2) + pow(2 * y_start + y_step + length_side, 2));
	const float temp_alpha = acos((pow(temp_a, 2) + pow(temp_b, 2) - pow(temp_c, 2)) / 2 / temp_a / temp_b);
	//site for turn
	const float turn_x1 = (temp_a - length_side) / 2;
	const float turn_y1 = y_start + y_step / 2;
	const float turn_x0 = turn_x1 - temp_b * cos(temp_alpha);
	const float turn_y0 = temp_b * sin(temp_alpha) - turn_y1 - length_side;
	
	static uint32_t currentTime = 0;
	static uint16_t previousTime = 0;
	uint16_t cycleTime = 0;
	// ////////////////////////////////////////////////////////////////////////
	
	 int act = 1;
	 char val;
	
	 String header;
	 const char *ssid = "QuadBot-T"; //热点名称，自定义
	 const char *password = "12345678";//连接密码，自定义
	 void Task1code( void *pvParameters );
	 void Task2code( void *pvParameters );
	 //wifi在core0，其他在core1；1为大核
	 WiFiServer server(80);
	 
	 void servo_attach(void)
{
  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 3; j++)
    {
      servo[i][j].attach(servo_pin[i][j], 500, 2500);
      delay(100);
    }
  }
}

void servo_detach(void)
{
  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 3; j++)
    {
      servo[i][j].detach();
      delay(100);
    }
  }
}

void Task2(void *pvParameters) 
{
  while(1)
  {
    vTaskDelay(15);
    servo_service();
  }
}


/*
  - sit
  - blocking function
   ---------------------------------------------------------------------------*/
void sit(void)
{
	move_speed = stand_seat_speed;
	for (int leg = 0; leg < 4; leg++)
	{
		set_site(leg, KEEP, KEEP, z_boot);
	}
	wait_all_reach();
}

/*
  - stand
  - blocking function
   ---------------------------------------------------------------------------*/
void stand(void)
{
	move_speed = stand_seat_speed;
	for (int leg = 0; leg < 4; leg++)
	{
		set_site(leg, KEEP, KEEP, z_default);
	}
	wait_all_reach();
}


/*
  - spot turn to left
  - blocking function
  - parameter step steps wanted to turn
   ---------------------------------------------------------------------------*/
void turn_left(unsigned int step)
{
	move_speed = spot_turn_speed;
	while (step-- > 0)
	{
		if (site_now[3][1] == y_start)
		{
			//leg 3&1 move
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x1 - x_offset, turn_y1, z_default);
			set_site(1, turn_x0 - x_offset, turn_y0, z_default);
			set_site(2, turn_x1 + x_offset, turn_y1, z_default);
			set_site(3, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(3, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x1 + x_offset, turn_y1, z_default);
			set_site(1, turn_x0 + x_offset, turn_y0, z_default);
			set_site(2, turn_x1 - x_offset, turn_y1, z_default);
			set_site(3, turn_x0 - x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(1, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_default);
			set_site(1, x_default + x_offset, y_start, z_up);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			set_site(1, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 0&2 move
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_up);
			set_site(1, turn_x1 + x_offset, turn_y1, z_default);
			set_site(2, turn_x0 - x_offset, turn_y0, z_default);
			set_site(3, turn_x1 - x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x0 - x_offset, turn_y0, z_default);
			set_site(1, turn_x1 - x_offset, turn_y1, z_default);
			set_site(2, turn_x0 + x_offset, turn_y0, z_default);
			set_site(3, turn_x1 + x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(2, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_up);
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();

			set_site(2, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - spot turn to right
  - blocking function
  - parameter step steps wanted to turn
   ---------------------------------------------------------------------------*/
void turn_right(unsigned int step)
{
	move_speed = spot_turn_speed;
	while (step-- > 0)
	{
		if (site_now[2][1] == y_start)
		{
			//leg 2&0 move
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x0 - x_offset, turn_y0, z_default);
			set_site(1, turn_x1 - x_offset, turn_y1, z_default);
			set_site(2, turn_x0 + x_offset, turn_y0, z_up);
			set_site(3, turn_x1 + x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(2, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_default);
			set_site(1, turn_x1 + x_offset, turn_y1, z_default);
			set_site(2, turn_x0 - x_offset, turn_y0, z_default);
			set_site(3, turn_x1 - x_offset, turn_y1, z_default);
			wait_all_reach();

			set_site(0, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_up);
			set_site(1, x_default + x_offset, y_start, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			set_site(0, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 1&3 move
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(0, turn_x1 + x_offset, turn_y1, z_default);
			set_site(1, turn_x0 + x_offset, turn_y0, z_up);
			set_site(2, turn_x1 - x_offset, turn_y1, z_default);
			set_site(3, turn_x0 - x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(1, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(0, turn_x1 - x_offset, turn_y1, z_default);
			set_site(1, turn_x0 - x_offset, turn_y0, z_default);
			set_site(2, turn_x1 + x_offset, turn_y1, z_default);
			set_site(3, turn_x0 + x_offset, turn_y0, z_default);
			wait_all_reach();

			set_site(3, turn_x0 + x_offset, turn_y0, z_up);
			wait_all_reach();

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_default);
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();

			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - go forward
  - blocking function
  - parameter step steps wanted to go
   ---------------------------------------------------------------------------*/
void step_forward(unsigned int step)
{
	move_speed = leg_move_speed;
	 while (step-- > 0)
	{
    Serial.println(step);
		if (site_now[2][1] == y_start)
		{
			//leg 2&1 move
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default + x_offset, y_start, z_default);
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 0&3 move
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start, z_default);
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

/*
  - go back
  - blocking function
  - parameter step steps wanted to go
   ---------------------------------------------------------------------------*/
void step_back(unsigned int step)
{
	move_speed = leg_move_speed;
	while (step-- > 0)
	{
		if (site_now[3][1] == y_start)
		{
			//leg 3&0 move
			set_site(3, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(3, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(1, x_default + x_offset, y_start, z_default);
			set_site(2, x_default - x_offset, y_start + y_step, z_default);
			set_site(3, x_default - x_offset, y_start + y_step, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(0, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(0, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
		else
		{
			//leg 1&2 move
			set_site(1, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(1, x_default + x_offset, y_start + 2 * y_step, z_default);
			wait_all_reach();

			move_speed = body_move_speed;

			set_site(0, x_default - x_offset, y_start + y_step, z_default);
			set_site(1, x_default - x_offset, y_start + y_step, z_default);
			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_default);
			set_site(3, x_default + x_offset, y_start, z_default);
			wait_all_reach();

			move_speed = leg_move_speed;

			set_site(2, x_default + x_offset, y_start + 2 * y_step, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start, z_up);
			wait_all_reach();
			set_site(2, x_default + x_offset, y_start, z_default);
			wait_all_reach();
		}
	}
}

// add by RegisHsu

void body_left(int i)
{
	set_site(0, site_now[0][0] + i, KEEP, KEEP);
	set_site(1, site_now[1][0] + i, KEEP, KEEP);
	set_site(2, site_now[2][0] - i, KEEP, KEEP);
	set_site(3, site_now[3][0] - i, KEEP, KEEP);
	wait_all_reach();
}

void body_right(int i)
{
	set_site(0, site_now[0][0] - i, KEEP, KEEP);
	set_site(1, site_now[1][0] - i, KEEP, KEEP);
	set_site(2, site_now[2][0] + i, KEEP, KEEP);
	set_site(3, site_now[3][0] + i, KEEP, KEEP);
	wait_all_reach();
}

void hand_wave(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	move_speed = 1;
	if (site_now[3][1] == y_start)
	{
		body_right(15);
		x_tmp = site_now[2][0];
		y_tmp = site_now[2][1];
		z_tmp = site_now[2][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(2, turn_x1, turn_y1, 50);
			wait_all_reach();
			set_site(2, turn_x0, turn_y0, 50);
			wait_all_reach();
		}
		set_site(2, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_left(15);
	}
	else
	{
		body_left(15);
		x_tmp = site_now[0][0];
		y_tmp = site_now[0][1];
		z_tmp = site_now[0][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(0, turn_x1, turn_y1, 50);
			wait_all_reach();
			set_site(0, turn_x0, turn_y0, 50);
			wait_all_reach();
		}
		set_site(0, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_right(15);
	}
}

void hand_shake(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	move_speed = 1;
	if (site_now[3][1] == y_start)
	{
		body_right(15);
		x_tmp = site_now[2][0];
		y_tmp = site_now[2][1];
		z_tmp = site_now[2][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(2, x_default - 30, y_start + 2 * y_step, 55);
			wait_all_reach();
			set_site(2, x_default - 30, y_start + 2 * y_step, 10);
			wait_all_reach();
		}
		set_site(2, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_left(15);
	}
	else
	{
		body_left(15);
		x_tmp = site_now[0][0];
		y_tmp = site_now[0][1];
		z_tmp = site_now[0][2];
		move_speed = body_move_speed;
		for (int j = 0; j < i; j++)
		{
			set_site(0, x_default - 30, y_start + 2 * y_step, 55);
			wait_all_reach();
			set_site(0, x_default - 30, y_start + 2 * y_step, 10);
			wait_all_reach();
		}
		set_site(0, x_tmp, y_tmp, z_tmp);
		wait_all_reach();
		move_speed = 1;
		body_right(15);
	}
}

void head_up(int i)
{
	set_site(0, KEEP, KEEP, site_now[0][2] - i);
	set_site(1, KEEP, KEEP, site_now[1][2] + i);
	set_site(2, KEEP, KEEP, site_now[2][2] - i);
	set_site(3, KEEP, KEEP, site_now[3][2] + i);
	wait_all_reach();
}

void head_down(int i)
{
	set_site(0, KEEP, KEEP, site_now[0][2] + i);
	set_site(1, KEEP, KEEP, site_now[1][2] - i);
	set_site(2, KEEP, KEEP, site_now[2][2] + i);
	set_site(3, KEEP, KEEP, site_now[3][2] - i);
	wait_all_reach();
}

void body_dance(int i)
{
	float x_tmp;
	float y_tmp;
	float z_tmp;
	float body_dance_speed = 2;
	sit();
	move_speed = 1;
	set_site(0, x_default, y_default, KEEP);
	set_site(1, x_default, y_default, KEEP);
	set_site(2, x_default, y_default, KEEP);
	set_site(3, x_default, y_default, KEEP);
	wait_all_reach();
	//stand();
	set_site(0, x_default, y_default, z_default - 20);
	set_site(1, x_default, y_default, z_default - 20);
	set_site(2, x_default, y_default, z_default - 20);
	set_site(3, x_default, y_default, z_default - 20);
	wait_all_reach();
	move_speed = body_dance_speed;
	head_up(30);
	for (int j = 0; j < i; j++)
	{
		if (j > i / 4)
			move_speed = body_dance_speed * 2;
		if (j > i / 2)
			move_speed = body_dance_speed * 3;
		set_site(0, KEEP, y_default - 20, KEEP);
		set_site(1, KEEP, y_default + 20, KEEP);
		set_site(2, KEEP, y_default - 20, KEEP);
		set_site(3, KEEP, y_default + 20, KEEP);
		wait_all_reach();
		set_site(0, KEEP, y_default + 20, KEEP);
		set_site(1, KEEP, y_default - 20, KEEP);
		set_site(2, KEEP, y_default + 20, KEEP);
		set_site(3, KEEP, y_default - 20, KEEP);
		wait_all_reach();
	}
	move_speed = body_dance_speed;
	head_down(30);
}


/*
  - microservos service /timer interrupt function/50Hz
  - when set site expected,this function move the end point to it in a straight line
  - temp_speed[4][3] should be set before set expect site,it make sure the end point
   move in a straight line,and decide move speed.
   ---------------------------------------------------------------------------*/
void servo_service(void)
{
//	sei();
	static float alpha, beta, gamma;

	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			if (abs(site_now[i][j] - site_expect[i][j]) >= abs(temp_speed[i][j]))
				site_now[i][j] += temp_speed[i][j];
			else
				site_now[i][j] = site_expect[i][j];
		}

		cartesian_to_polar(alpha, beta, gamma, site_now[i][0], site_now[i][1], site_now[i][2]);
		polar_to_servo(i, alpha, beta, gamma);
	}

	rest_counter++;
}

/*
  - set one of end points' expect site
  - this founction will set temp_speed[4][3] at same time
  - non - blocking function
   ---------------------------------------------------------------------------*/
void set_site(int leg, float x, float y, float z)
{
	float length_x = 0, length_y = 0, length_z = 0;

	if (x != KEEP)
		length_x = x - site_now[leg][0];
	if (y != KEEP)
		length_y = y - site_now[leg][1];
	if (z != KEEP)
		length_z = z - site_now[leg][2];

	float length = sqrt(pow(length_x, 2) + pow(length_y, 2) + pow(length_z, 2));

	temp_speed[leg][0] = length_x / length * move_speed * speed_multiple;
	temp_speed[leg][1] = length_y / length * move_speed * speed_multiple;
	temp_speed[leg][2] = length_z / length * move_speed * speed_multiple;

	if (x != KEEP)
	site_expect[leg][0] = x;
	if (y != KEEP)
	site_expect[leg][1] = y;
	if (z != KEEP)
	site_expect[leg][2] = z;
}

/*
  - wait one of end points move to expect site
  - blocking function
   ---------------------------------------------------------------------------*/
void wait_reach(int leg)
{
    while (1)
    {
	      if (site_now[leg][0] == site_expect[leg][0])
		        if (site_now[leg][1] == site_expect[leg][1])
			          if (site_now[leg][2] == site_expect[leg][2])
				            break;
 
        vTaskDelay(1);
    }
}

/*
  - wait all of end points move to expect site
  - blocking function
   ---------------------------------------------------------------------------*/
void wait_all_reach(void)
{
	for (int i = 0; i < 4; i++)
		wait_reach(i);
}

/*
  - trans site from cartesian to polar
  - mathematical model 2/2
   ---------------------------------------------------------------------------*/
void cartesian_to_polar(volatile float &alpha, volatile float &beta, volatile float &gamma, volatile float x, volatile float y, volatile float z)
{
	//calculate w-z degree
	float v, w;
	w = (x >= 0 ? 1 : -1) * (sqrt(pow(x, 2) + pow(y, 2)));
	v = w - length_c;
	alpha = atan2(z, v) + acos((pow(length_a, 2) - pow(length_b, 2) + pow(v, 2) + pow(z, 2)) / 2 / length_a / sqrt(pow(v, 2) + pow(z, 2)));
	beta = acos((pow(length_a, 2) + pow(length_b, 2) - pow(v, 2) - pow(z, 2)) / 2 / length_a / length_b);
	//calculate x-y-z degree
	gamma = (w >= 0) ? atan2(y, x) : atan2(-y, -x);
	//trans degree pi->180
	alpha = alpha / pi * 180;
	beta = beta / pi * 180;
	gamma = gamma / pi * 180;
}

/*
  - trans site from polar to microservos
  - mathematical model map to fact
  - the errors saved in eeprom will be add
   ---------------------------------------------------------------------------*/
void polar_to_servo(int leg, float alpha, float beta, float gamma)
{
	if (leg == 0)
	{
		alpha = 90 - alpha;
		beta = beta;
		 gamma += 90;
//		gamma = 90 - gamma;
	}
	else if (leg == 1)
	{
		alpha += 90;
		beta = 180 - beta;
		 gamma = 90 - gamma;
//		gamma += 90;
	}
	else if (leg == 2)
	{
		alpha += 90;
		beta = 180 - beta;
		 gamma = 90 - gamma;
//		gamma += 90;
	}
	else if (leg == 3)
	{
		alpha = 90 - alpha;
		beta = beta;
		 gamma += 90;
//		gamma = 90 - gamma;
	}

	servo[leg][0].write(alpha+offset[leg][0]);
	servo[leg][1].write(beta+offset[leg][1]);
	servo[leg][2].write(gamma+offset[leg][2]);
}
	 `;
	
	Blockly.Arduino.setups_.ure11 = `
	//ESP32看门狗设置 需要先引入 #include "soc/rtc_wdt.h" //设置看门狗用
  rtc_wdt_protect_off(); //看门狗写保护关闭
  //rtc_wdt_protect_on(); //看门狗写保护打开
  //rtc_wdt_disable(); //禁用看门狗
  rtc_wdt_enable(); //启用看门狗
  rtc_wdt_feed(); //喂狗
  rtc_wdt_set_time(RTC_WDT_STAGE0, 7000); // 设置看门狗超时 7000ms.

  Serial.begin(9600);
  Serial.println("Robot starts initialization");
  //  mySerial.begin(9600);
  //initialize default parameter
  set_site(0, x_default - x_offset, y_start + y_step, z_boot);
  set_site(1, x_default - x_offset, y_start + y_step, z_boot);
  set_site(2, x_default + x_offset, y_start, z_boot);
  set_site(3, x_default + x_offset, y_start, z_boot);
  for (int i = 0; i < 4; i++)
  {
    for (int j = 0; j < 3; j++)
    {
      site_now[i][j] = site_expect[i][j];
    }
  }
  //start servo service
  // FlexiTimer2::set(20, servo_service);
  // FlexiTimer2::start();
  Serial.println("Servo service started");
  //initialize servos
  servo_attach();
  Serial.println("Servos initialized");
  Serial.println("Robot initialization Complete");

  WiFi.softAP(ssid, password);//不写password，即热点开放不加密
  IPAddress myIP = WiFi.softAPIP();//此为默认IP地址192.168.4.1，也可在括号中自行填入自定义IP地址
  Serial.print("AP IP address:");
  Serial.println(myIP);
  server.begin();
  Serial.println("Server started");

  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);//关闭低电压检测,避免无限重启
  xTaskCreatePinnedToCore(Task2, "Task2", 10000, NULL, 1, NULL,  1);
  `;
	return `
	
  WiFiClient client = server.available();  //监听连入设备
  if (client)
  {
    String currentLine = "";
    while (client.connected())
    {
      if (client.available())
      {
        char c = client.read();
        header += c;
        if (c == '\\n')
        {
          if (currentLine.length() == 0)
          {
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println();
            client.println("<!DOCTYPE html><html>");
            client.println("<head><meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\">");
            client.println("<meta charset=\\"UTF-8\\">");
            client.println("<link rel=\\"icon\\" href=\\"data:,\\">");
            client.println("<style>html { font-family: Helvetica; display: inline-block; margin: 0px auto; text-align: center;}");
            client.println(".button { background-color: #096625; border: none; color: white; padding: 20px 25px; ");
            client.println("text-decoration: none; font-size: 18px; margin: 2px; cursor: pointer;}");
            client.println(".button2 {background-color: #555555; border: none; color: white; padding: 16px 20px;text-decoration: none; font-size: 16px; margin: 1px; cursor: pointer;}</style></head>");
            client.println("<body><h1>Quadruped Spider Robot</h1>");
            client.println("<p><a href=\\"/20/on\\"><button class=\\"button\\">前进</button></a></p>");
            client.println("<p><a href=\\"/21/on\\"><button class=\\"button\\">左转</button></a><a href=\\"/22/on\\"><button class=\\"button\\">停止</button></a><a href=\\"/23/on\\"><button class=\\"button\\">右转</button></a></p>");
            client.println("<p><a href=\\"/24/on\\"><button class=\\"button\\">后退</button></a></p>");
            client.println("<p><a href=\\"/25/on\\"><button class=\\"button2\\">挥手</button></a><a href=\\"/26/on\\"><button class=\\"button2\\">握手</button></a><a href=\\"/27/on\\"><button class=\\"button2\\">跳舞</button></a><a  href=\\"/28/on\\"><button class=\\"button2\\">坐下</button></a></p>");
            client.println("</body></html>");
            client.println();
	`;
};
Blockly.Arduino.VFOR = function (block) {
	return [`header.indexOf("GET /20/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VBACK = function (block) {
	return [`header.indexOf("GET /24/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VLEFT = function (block) {
	return [`header.indexOf("GET /21/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VRIGHT = function (block) {
	return [`header.indexOf("GET /23/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VWAVE = function (block) {
	return [`header.indexOf("GET /25/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VSHAKE = function (block) {
	return [`header.indexOf("GET /26/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VDANCE = function (block) {
	return [`header.indexOf("GET /27/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VSIT = function (block) {
	return [`header.indexOf("GET /28/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.VSTAND = function (block) {
	return [`header.indexOf("GET /22/on") >= 0`,Blockly.Arduino.ORDER_ATOMIC];
};
Blockly.Arduino.break = function (block) {
	return `break;`;
};
Blockly.Arduino.KONG = function (block) {
	return `} else {
		currentLine = ""; //如果收到是换行，则清空字符串变量
	  }
	} else if (c != '\\r') {
	  currentLine += c;
	}
  }
  vTaskDelay(1);
}
header = "";
client.stop(); //断开连接
}
	`;
};