---
title: "Molecular Dynamics Simulator"
description: "A writeup for a basic python based molecular dynamics simulator"
publishDate: "08 May 2026"
tags: ["matsci"]
---

## Overview

As part of the MSE402 course at IITGN taught by Professor Raghavan Ranganathan, we were given topics for our course projects. From the variety of projects available to me, I chose to work on creating my own molecular dynamics simulator, as it allowed me to apply concepts I had learned from both aspects of my education at IITGN, as a student of both Materials Science and Computer Engineering.

The following article is a quick explainer of what I did as part of my course project. I'll follow the code flow and explain the theory behind the code snippets when they appear.

## Code Flow

The code for the entire project is hosted [here](https://github.com/Dashlander/MSE-402/blob/main/Project/MD2_0.py). I'll be picking up code snippets.

### 1. System Initialisation

A few variables are declared for initialising the system, holding values of the box size, mass, the timestep for the simulation, the $\sigma$ and $\epsilon$ values, and the initial temperature of the system.

To forgo redundant calculations, I precomputed constants which would be used at every timestep.

```python
def init_pos(n, Edgelength_box):
```
The `init_pos` function generates atom positions in 3D using a normal distribution. I used a uniform distribution at first, but quickly realised that it would not produce a dynamic system. A modulo operator is used to wrap around atoms that fall outside the box boundaries, and ensures that the Periodic Boundary Condition is met.

The Periodic Boundary Condition is a concept used in molecular simulations that allows a finite cell to simulate an infinite space. The core idea is that we assume the cell to have no walls. Instead of walls at the edges, the box is treated as if it tiles infinitely in all directions. So if an atom leaves the box from one side, it is treated as having entered from the other side. We do this to ensure that at any given time, the number of atoms inside the box remains constant as we simulate a bulk system.

```python
def init_vel(n, Temp):
```
The `init_vel` function assigns initial velocities drawn from a Gaussian distribution with a width set by the thermal energy scale $\sqrt{\frac{k_B T}{m}}$. To ensure it accurately follows a physical system where particle velocities follow a Maxwell-Boltzmann distribution, we separately initialise their velocity components in 1D and then combine them into a velocity vector[^1].

To ensure that there is no drift in the system and that it is at zero momentum, the mean velocity is subtracted from all atoms.

[^1]: "27.2: The Gaussian Distribution of One Component of the Molecular Velocity," Chemistry LibreTexts, Jun. 21, 2014. [Link](https://chem.libretexts.org/Bookshelves/Physical_and_Theoretical_Chemistry_Textbook_Maps/Physical_Chemistry_(LibreTexts)/27%3A_The_Kinetic_Theory_of_Gases/27.02%3A_The_Gaussian_Distribution_of_One_Component_of_the_Molecular_Velocity) (accessed May 08, 2026).

‌


### 2. Minimum Image Convention
```python
def minimum_image_distance(r, Edgelength_box):
```
While the Periodic Boundary Condition ensures that the number of atoms we calculate for remains constant, it introduces a complication for force calculations. An atom at one edge of the box will see another atom at the opposite edge appear as two images — one closer to it in the neighbouring periodic cell, and one farther away in its own cell. To ensure we use the closer image, as we aim to simulate an infinite system, we apply the minimum image criterion.

The way this is implemented in the code is by shifting each separation vector in `delta_r` into the range $[-\frac{L}{2}, +\frac{L}{2}]$, so forces are always computed using the nearest image.

### 3. Lennard-Jones Potential and Forces

```python
def lj_potential_and_force(r_ij, cutoff_distance):
```
The LJ potential and force function calculates interactions for all atom pairs simultaneously using vectorised NumPy operations. This ensures that for a single timestep, the calculation is done in matrix form rather than with nested loops. The LJ force magnitude between atoms *i* and *j* is given as:

$$F = \frac{48\varepsilon \cdot r^{-12} - 24\varepsilon \cdot r^{-6}}{r}$$

Diagonal entries (self-interactions) are masked with `np.inf` to avoid division by zero. The total force on each atom is obtained by summing the N×N×3 force array along axis 1, giving an N×3 array of net force vectors. The potential is halved to correct for double-counting of pairs.

### 4. Thermodynamic Quantities

The thermodynamic quantities of interest are calculated at each timestep using standard formulas.

The standard KE is represented by: $KE = \frac{1}{2} m \Sigma \left| \vec{v^2} \right|$

The temperature is derived from the equipartition theorem  
$$T = \frac{2 \cdot KE}{3 N k_B}$$

### 5. Berendsen Thermostat

```python
def berendsen_thermostat(v, Temp, tau, time_step):
```

The Berendsen thermostat is used to prevent numerical drift from causing runaway temperature changes, and is applied every 25 iterations. It rescales velocities by a factor of:

$$\lambda = \sqrt{1 + \frac{\Delta t}{\tau}\left(\frac{T_0}{T} - 1\right)}$$

This weakly couples the system to a heat bath at the target temperature $T_0$, nudging the instantaneous temperature back toward the set point without abruptly disrupting the dynamics of the system.


### 6. Output

```python
def write_xyz(filename, r, iteration):
```
The `write_xyz` function dumps atom coordinates every 100 iterations to a dump file in `.lammpstrj` format, which is OVITO-compatible and allows easy visualisation.

### 7. The Main Loop — Velocity Verlet Integration

Everything above sets up the functions used to implement the **Velocity Verlet** algorithm, a symplectic integrator that conserves energy over the long run.

The first step is updating the positions using the equation:
$$ r(t + \Delta t) = r(t) + v(t) \cdot \Delta t + \tfrac{1}{2} a(t) \cdot \Delta t^2 $$

We then apply PBC to wrap positions into the box and compute forces at the new positions. The velocities are then updated for the new timestep:
$$v(t + \Delta t) = v(t) + \tfrac{1}{2} \left[ a(t) + a(t + \Delta t) \right] \cdot \Delta t $$

The thermostat is applied every 25 steps, and the coordinates are dumped every 100 iterations.

## Results Summary
The code was then run and compared with LAMMPS to draw an equivalent comparison.

A few key findings:

- **Runtime**: LAMMPS completed the run in 3 seconds; the Python code took 3,519 seconds (more than a 1000 times slower), reflecting the overhead of a high-level interpreted language compared to C++. While it was a great learning experience and let me apply things I had learned, this is not something that would be used in a production setting.

- **Potential Energy**: Both simulations stabilise to a mean, indicating equilibration. However, the Python run showed more fluctuation (Median Absolute Deviation of 1.46 vs. 0.348 for LAMMPS). I used the Median Absolute Deviation to measure statistical dispersion across the values.

- **Kinetic Energy**: The Coefficient of Variation was 0.306 for Python compared to 0.087 for LAMMPS. While the Python simulation was noisier, it was qualitatively consistent.

- **Radial Distribution Function (RDF)**: Both simulations produce similar RDF profiles, with no sharp decay due to the high simulation temperature (1000 K), consistent with a gas-phase system.