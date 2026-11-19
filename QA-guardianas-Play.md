# Guardianas · Resultados de Play

Seis biomas, cinco separaciones preparadas por bioma. El jugador permaneció inmóvil durante la aproximación. Se recolocó la guardiana para preparar cada distancia, y al jugador para provocar el siguiente golpe. El reloj empieza al volver la llamada de recogida. La distancia es tridimensional entre los pivotes en la primera y última muestra. Los tiempos son de servidor. El retorno mide desplazamiento neto, no longitud de ruta. Solo PATROL confirma llegada. Un retorno de 0 s en CHASE no constituye una medición válida. La identidad EggUid se conservó en las 30 muestras. Se observaron 12 entradas directas a CHASE en los casos preparados a 20 y 40 studs.

|Bioma|Objetivo (studs)|Inicial real|Estado inicial|Estado final|Final real|Tiempo (s)|Retorno neto (studs)|Observación retorno (s)|Estado al cierre|
|---|---:|---:|---|---|---:|---:|---:|---:|---|
|SakuraVillage|20|19.4|CHASE|CHASE|19.4|0.03|12.3|0.45|PATROL|
|SakuraVillage|40|39.1|CHASE|CHASE|39.1|0.01|28.1|0.90|PATROL|
|SakuraVillage|80|78.1|FAST_REENGAGE|CHASE|40.7|0.98|29.4|0.80|PATROL|
|SakuraVillage|150|147.4|FAST_REENGAGE|CHASE|40.7|2.15|29.4|0.66|PATROL|
|SakuraVillage|300|299.7|FAST_REENGAGE|FAST_REENGAGE|245.3|7.04|15.4|0.93|PATROL|
|CrystalLake|20|20.2|CHASE|CHASE|20.2|0.05|26.2|0.95|PATROL|
|CrystalLake|40|39.4|CHASE|CHASE|39.4|0.05|44.4|1.80|PATROL|
|CrystalLake|80|78.4|FAST_REENGAGE|CHASE|41.2|1.20|48.5|1.75|PATROL|
|CrystalLake|150|148.0|FAST_REENGAGE|CHASE|40.6|3.98|47.9|1.75|PATROL|
|CrystalLake|300|298.9|FAST_REENGAGE|CHASE|40.8|5.40|47.8|1.65|PATROL|
|ShadowForest|20|19.1|CHASE|CHASE|19.1|0.01|0.0|0.00|CHASE|
|ShadowForest|40|39.1|CHASE|CHASE|39.1|0.05|28.9|0.85|PATROL|
|ShadowForest|80|79.2|FAST_REENGAGE|CHASE|40.5|1.05|0.0|0.00|CHASE|
|ShadowForest|150|148.9|CHASE|CHASE|148.9|0.05|24.6|3.03|FAST_RETURN|
|ShadowForest|300|299.1|FAST_REENGAGE|FAST_REENGAGE|126.5|7.05|1.8|3.05|FAST_RETURN|
|CelestialTemple|20|19.7|CHASE|CHASE|19.7|0.01|12.5|0.33|PATROL|
|CelestialTemple|40|39.1|CHASE|CHASE|39.1|0.05|29.6|0.70|PATROL|
|CelestialTemple|80|77.5|FAST_REENGAGE|CHASE|40.7|0.85|31.3|0.75|PATROL|
|CelestialTemple|150|148.8|FAST_REENGAGE|CHASE|40.9|2.10|31.6|0.65|PATROL|
|CelestialTemple|300|298.6|FAST_REENGAGE|CHASE|41.1|4.25|31.9|0.65|PATROL|
|FrozenKingdom|20|18.5|CHASE|CHASE|18.5|0.05|10.0|0.25|PATROL|
|FrozenKingdom|40|37.9|CHASE|CHASE|37.9|0.01|27.5|0.55|PATROL|
|FrozenKingdom|80|78.4|FAST_REENGAGE|CHASE|41.2|6.80|29.8|0.55|PATROL|
|FrozenKingdom|150|149.3|FAST_REENGAGE|CHASE|40.5|6.85|29.2|0.50|PATROL|
|FrozenKingdom|300|299.2|FAST_REENGAGE|CHASE|39.0|3.96|30.4|0.60|PATROL|
|InfernalValley|20|17.8|CHASE|CHASE|17.8|0.01|11.1|0.20|PATROL|
|InfernalValley|40|37.5|CHASE|CHASE|37.5|0.05|23.9|0.55|PATROL|
|InfernalValley|80|80.2|FAST_REENGAGE|CHASE|40.7|7.04|34.2|0.51|PATROL|
|InfernalValley|150|144.4|FAST_REENGAGE|FAST_REENGAGE|130.4|7.09|1.8|3.05|FAST_RETURN|
|InfernalValley|300|298.6|FAST_REENGAGE|CHASE|40.8|3.10|34.6|0.50|PATROL|

## Recogida y pruebas complementarias

La validación isGrounded lanza un rayo de 6 studs. En el punto usado por egg_pick, tres nidos de Celestial dieron alturas de 6,58–7,24 studs y tres de Infernal de 7,23–9,89. Tras ajustar la altura al suelo, el servidor aceptó ambos a 5,2 y 7,1 studs del huevo respectivamente. La zona estaba abierta.

En 161 Heartbeats (4 s), mediana/p95 del intervalo: 17,00/52,43 ms; paso de física: 0,51/0,69 ms. Muestra descriptiva sin control anterior. RTW_DevHarness: state 4/4; audit_multi 8/8 con un cliente; eggstats 11 correctas y 5 fallidas. No se atribuyen los fallos estadísticos al movimiento.

Puerta segura, prueba de cruce por colocación: a Z = −178 había CHASE y a −169 FAST_RETURN sin objetivo en Crystal, Shadow, Celestial, Frozen e Infernal. Sakura no armó CHASE en esa prueba. Esta prueba solo valida el límite, no la navegación de toda la huida. En refresco real, una observación válida pasó de FAST_REENGAGE a FAST_RETURN sin objetivo; el EggUid observado ya no estaba en Workspace.Capsules. Los intentos restantes no coincidieron con el estado previsto.

## Segunda sesión, dos clientes y refresco

En servidores locales nuevos, el cliente A recibió el derribo y B recogió el mismo modelo y EggUid. Los seis biomas dirigieron FAST_REENGAGE a B y limpiaron ChasedBy de A. Shadow requirió repetir la preparación del derribo. Al desconectar B en Infernal se comprobó que había salido de Players y, dos segundos después, ChaseTarget era nil y el huevo estaba Available. La lectura previa a confirmar la desconexión todavía mostraba Carried.

Se repitió la prueba de puerta en Sakura: tres cruces dieron CHASE a −178 y FAST_RETURN a −169. Así queda comprobada la transición de puerta en los seis biomas. En Sakura también se confirmó el refresco en los tres estados: CHASE → FAST_RETURN, FAST_RETURN → FAST_RETURN y FAST_REENGAGE → FAST_RETURN. Los tres quedaron sin objetivo. No se cronometró una huida natural completa ni se midió CPU contra una versión anterior. El harness de la sesión anterior verificó muerte y respawn en Shadow. Se retiró el instrumento temporal y se terminó en edición, sin publicar.
