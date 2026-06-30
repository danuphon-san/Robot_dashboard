Frontend Prompt: Machine Health Monitoring Dashboard POC

Create a frontend web dashboard for a Machine Health Monitoring POC using the attached datasets:

* machine_state
* machine_anomaly_scores

Use only fields available in these tables. Do not invent unsupported metrics.

⸻

Objective

Design a clean, modern web dashboard for monitoring robot/machine health in a manufacturing line.

The dashboard should help users answer:

1. Which machines are running, stopped, warning, or critical?
2. Which machines have the highest anomaly score?
3. Which robot axis J1–J7 is abnormal?
4. What are the latest machine conditions?
5. Which machines should maintenance check first?

⸻

Dashboard Pages

Build 3 pages for the POC.

Page 1: Overview

Purpose: show the current health status of all machines.

Display

Use KPI cards for:

* Total machines
* Running machines
* Stopped machines
* Warning machines
* Critical machines
* Average anomaly score

Use these visual components:

* Machine status tile map
* Top risk machines table
* Anomaly score trend line chart
* Status distribution donut chart

Data Fields

Use:

* machine_id
* topic
* ts
* exec_state
* operating_mode
* motor_power_state
* score
* threshold_warn
* threshold_crit
* state

⸻

Page 2: Machine Detail

Purpose: inspect one selected machine in detail.

Display

At the top, show machine information cards:

* Machine ID
* Latest timestamp
* Hot code
* Execution program
* Execution step
* Execution state
* Operating mode
* Motor power state
* Anomaly score
* Warning threshold
* Critical threshold
* Current anomaly state

Show J1–J7 robot axis values using bar charts:

* joint_angle
* joint_cmd
* joint_dev
* joint_speed
* motor_current
* motor_current_cmd

Show trend charts:

* Anomaly score over time
* Selected axis metric over time

Show tables:

* Top abnormal axes from top_axes
* Top abnormal features from top_features

Data Fields

Use:

* machine_id
* ts
* hot_code
* exec_program
* exec_step
* exec_state
* operating_mode
* motor_power_state
* joint_angle
* joint_cmd
* joint_dev
* joint_speed
* motor_current
* motor_current_cmd
* score
* threshold_warn
* threshold_crit
* state
* top_axes
* top_features

⸻

Page 3: Alert Priority

Purpose: help maintenance decide which machine to check first.

Display

Create an alert priority table sorted by:

1. state = critical
2. state = warning
3. Highest score

Table columns:

* Priority
* Machine ID
* Timestamp
* Score
* Warning threshold
* Critical threshold
* State
* Top axes
* Top features
* Suggested inspection focus

Suggested inspection focus should be generated only from available fields:

* If top_axes contains J1–J7, show the axis to check.
* If top_features contains joint_dev, show “Check joint deviation.”
* If top_features contains motor_current, show “Check motor current/load.”
* If top_features contains joint_speed, show “Check joint speed behavior.”

Also show:

* Critical alert count
* Warning alert count
* Top 10 highest score machines
* Top abnormal axes frequency chart
* Top abnormal features frequency chart

⸻

UI Requirements

Use a modern industrial dashboard style:

* Dark or light neutral background
* Status colors:
    * Green = normal
    * Yellow = warning
    * Red = critical
    * Gray = stopped or no data
* Use cards, tables, charts, and filters
* Make the layout responsive for desktop and large shop-floor display screens
* Keep the POC simple and usable

⸻

Required Filters

Add global filters:

* Machine ID
* Time range
* State: normal / warning / critical
* Metric selector:
    * joint_angle
    * joint_cmd
    * joint_dev
    * joint_speed
    * motor_current
    * motor_current_cmd

⸻

7-Axis Array Handling

The frontend should not display raw array strings directly.

Convert each 7-axis array into J1–J7 format.

Example:

joint_dev = {120,80,30,75,3884,110,60}

Display as:

Axis	Value
J1	120
J2	80
J3	30
J4	75
J5	3884
J6	110
J7	60

Use this format for charts and tables.

⸻

API Assumption for POC

Assume the frontend will call backend REST APIs:

GET /api/overview
GET /api/machines
GET /api/machines/{machine_id}
GET /api/machines/{machine_id}/trend?metric=joint_dev&from=...&to=...
GET /api/alerts

The frontend should not connect directly to SQL.

⸻

Technical Recommendation

Build the frontend using:

* React
* TypeScript
* Tailwind CSS
* Recharts or ECharts
* REST API integration
* Polling every 10–30 seconds for overview and alerts

⸻

Expected Output

Generate the frontend implementation with:

1. Dashboard layout
2. Navigation sidebar
3. Overview page
4. Machine detail page
5. Alert priority page
6. Reusable KPI card component
7. Reusable status badge component
8. Reusable chart components
9. API service layer
10. Mock data fallback for POC testing

Keep the design practical, clean, and suitable for a manufacturing machine health monitoring POC.