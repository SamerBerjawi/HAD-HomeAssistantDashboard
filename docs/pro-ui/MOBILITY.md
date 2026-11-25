# HAD Pro Mobility

## 1. Garage entry

Approved by the owner on 2026-11-24. Count distinct vehicles within each category.

| Cars | Bikes | Entry |
|---|---|---|
| 1 | 0 | Car Garage |
| 0 | 1 | Bike Garage |
| 1 | 1 | Separate Car and Bike tabs |
| 2 or more | Any | Bays first |
| Any | 2 or more | Bays first |

Group bays by Cars and Bikes. Use a single column on phones and a grid within each group on wider screens. Each bay shows the vehicle name, picture or silhouette, available range and state. Selecting a bay opens the vehicle Garage with a way back to all bays.

## 2. Vehicle Garage

Car sections cover vehicle identity and range, charge and cabin controls, location and speed history, and vehicle condition. Bike sections cover identity and range, battery and ride activity, location, and bike condition.

## 3. Data and studio

Classic Mobility derives one car and one bike through `useMobilityData`. A multiple-vehicle implementation needs vehicle-scoped readings and service targets. Keep the classic UI intact.

Dev route `/?studio=mobility`. Owner approved emerald (hue 155) for both vehicle types. The first studio review compares A · Garage floor, B · Range dial and C · Departure board on the same simulated vehicles. Zero-vehicle presentation and production component choices remain open.

The owner requested A + B. In D, the vehicle sits in A’s marked bay beside B’s charge ring with remaining range in the centre. Name, state and location sit below. The owner approved D for production. The individual Garage sections await review.

## 4. Car header studio

The owner requested A · Parking pass, B · Dashboard dial and C · Garage door side by side. Compare the same charging, parked, driving and unavailable car readings. Owner chose C · Garage door for production.
