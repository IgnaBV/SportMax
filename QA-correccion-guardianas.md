# Corrección del movimiento de guardianas · pruebas locales en Studio

## Cambios y diagnóstico

Copia previa en ServerStorage.Backups.Backup_Correccion_Guardianas_1795056739. GuardianAI conserva los estados y el perfil de velocidad. En FAST_REENGAGE solicita una ruta hacia el portador y limita el último avance según la separación tridimensional. La tolerancia de salida es de 1 stud. GuardianMovers usa el mismo AlignPosition y AlignOrientation, revisa el suelo, comprueba obstáculos que colisionan y navega con puntos de ruta cuando hay bloqueo. Cancela resultados asíncronos obsoletos mediante una versión y limita la frecuencia de planificación. Se conservó el controlador de persecución estándar. No se cambiaron multiplicadores, ataques, velocidades normales ni economía.

Antes de la corrección, Hana encontró un Seto, Yoru permaneció a 106,8 studs a los 10 s y Kaen tuvo muestras de velocidad horizontal cero aun con un límite físico de unos 150 studs/s. El navegador anterior calculaba rutas periódicas incluso con paso libre y apuntaba a un punto teórico a 40 studs, sin garantía de que estuviera en el camino. Su objetivo físico avanzaba solo un paso de simulación por orden. Se corrigieron estos mecanismos en conjunto; no se aisló la contribución de cada uno. Yuki-Onna ya completó 80 studs en 0,76 s durante la repetición previa: sus 6,80 s históricos no se reprodujeron en ese arranque. En Yoru a 150 no hubo evidencia de una transición errónea una vez confirmado el derribo. Un intento que no completó el derribo quedó excluido.

## Comparación de las anomalías

|Bioma|Preparación (studs)|Antes en esta iteración|Matriz corregida|Separación final (studs)|Estado|
|---|---:|---|---:|---:|---|
|SakuraVillage|300|10.03 s, FAST_REENGAGE|14.00 s|300.1|FAST_REENGAGE|
|ShadowForest|300|10.05 s, FAST_REENGAGE|2.77 s|40.4|CHASE|
|ShadowForest|150|preparación inválida|1.41 s|40.2|CHASE|
|FrozenKingdom|80|0.76 s, CHASE|0.41 s|40.3|CHASE|
|InfernalValley|80|1.87 s, CHASE|0.35 s|40.8|CHASE|
|InfernalValley|150|7.73 s, CHASE|0.80 s|40.5|CHASE|

## Matriz de 30 reincorporaciones controladas

El tiempo incluye la recogida y el primer muestreo. Las posiciones se prepararon en Play. Los estados indican primera y última observación, por lo que la primera muestra puede ser posterior al cambio de estado. En los 30 casos se conservó el EggUid.

|Bioma|Preparación|Inicial 3D|Estado inicial|Tiempo (s)|Final 3D|Estado final|
|---|---:|---:|---|---:|---:|---|
|SakuraVillage|20|18.0|CHASE|0.84|18.0|CHASE|
|CrystalLake|20|20.0|CHASE|0.09|20.0|CHASE|
|ShadowForest|20|19.9|CHASE|0.05|19.9|CHASE|
|CelestialTemple|20|19.5|CHASE|0.05|19.5|CHASE|
|FrozenKingdom|20|19.1|CHASE|0.05|19.1|CHASE|
|InfernalValley|20|18.2|CHASE|0.05|18.2|CHASE|
|SakuraVillage|40|40.3|CHASE|0.06|40.3|CHASE|
|CrystalLake|40|40.5|CHASE|0.06|40.5|CHASE|
|ShadowForest|40|40.3|CHASE|0.05|40.3|CHASE|
|CelestialTemple|40|40.6|CHASE|0.05|40.6|CHASE|
|FrozenKingdom|40|40.7|CHASE|0.06|40.7|CHASE|
|InfernalValley|40|40.4|CHASE|0.05|40.4|CHASE|
|SakuraVillage|80|76.2|FAST_REENGAGE|0.65|40.3|CHASE|
|CrystalLake|80|77.4|FAST_REENGAGE|0.71|40.6|CHASE|
|ShadowForest|80|76.3|FAST_REENGAGE|0.57|40.9|CHASE|
|CelestialTemple|80|76.2|FAST_REENGAGE|0.51|40.2|CHASE|
|FrozenKingdom|80|74.3|FAST_REENGAGE|0.41|40.3|CHASE|
|InfernalValley|80|72.6|FAST_REENGAGE|0.35|40.8|CHASE|
|SakuraVillage|150|147.0|FAST_REENGAGE|1.37|39.9|CHASE|
|CrystalLake|150|148.1|FAST_REENGAGE|1.73|40.6|CHASE|
|ShadowForest|150|146.0|FAST_REENGAGE|1.41|40.2|CHASE|
|CelestialTemple|150|145.6|FAST_REENGAGE|1.23|40.6|CHASE|
|FrozenKingdom|150|144.1|FAST_REENGAGE|1.00|40.1|CHASE|
|InfernalValley|150|142.7|FAST_REENGAGE|0.80|40.5|CHASE|
|SakuraVillage|300|300.1|FAST_REENGAGE|14.00|300.1|FAST_REENGAGE|
|CrystalLake|300|295.3|FAST_REENGAGE|3.87|40.5|CHASE|
|ShadowForest|300|294.9|FAST_REENGAGE|2.77|40.4|CHASE|
|CelestialTemple|300|293.2|FAST_REENGAGE|2.37|40.9|CHASE|
|FrozenKingdom|300|294.4|FAST_REENGAGE|1.92|40.3|CHASE|
|InfernalValley|300|291.7|FAST_REENGAGE|1.57|40.8|CHASE|

Hana desde el corredor transitable, a 300 studs, alcanzó CHASE en 3,64 s a 40,7 studs. La preparación original a +300 coloca a Hana en el hub, más allá de la salida segura de Sakura. Un intento consiguió rodear el perímetro; otros quedaron bloqueados. Una búsqueda experimental desde (−31,4; 7,15; −84,45) exploró 344 nodos sin conexión a la puerta; también falló al ampliar la región y reducir el espaciado. Se retiró esa búsqueda. Esto no prueba imposibilidad global. El caso artificial sigue abierto.

## Retornos con derribo y llegada verificada

Se midió el tiempo desde la detección de FAST_RETURN hasta la salida del estado. Cada fila terminó en PATROL, con ChaseTarget vacío y sin AlignPosition activo. Longitud es la suma de desplazamientos 3D observados a cada Heartbeat.

|Bioma|Inicial al origen|Entrada tras preparar contacto (s)|Longitud (studs)|Tiempo retorno (s)|Restante 3D|
|---|---:|---:|---:|---:|---:|
|SakuraVillage|54.0|0.16|52.9|2.43|1.93|
|CrystalLake|107.0|0.05|105.8|2.18|1.42|
|ShadowForest|203.6|0.04|202.4|3.45|1.21|
|CelestialTemple|300.5|0.05|303.9|4.29|1.47|
|FrozenKingdom|501.4|0.04|500.1|4.60|1.38|
|InfernalValley|501.4|0.05|500.1|3.90|1.40|

## Movimiento del jugador

|Bioma|Condición|Desplazamiento del portador|Tiempo (s)|Separación final|Estado|
|---|---|---:|---:|---:|---|
|InfernalValley|F|2.2|0.86|39.3|CHASE|
|CelestialTemple|curve|3.1|1.17|39.6|CHASE|
|FrozenKingdom|heavy|1.9|1.10|40.1|CHASE|
|CrystalLake|advanced|13.8|1.72|39.6|CHASE|
|SakuraVillage|moving|5.0|1.31|40.4|CHASE|

F usó SuperSpeed y la recomendación del bioma. Los huevos avanzado y pesado se prepararon solo en Play con carryProfile. La orden de curva cambió de dirección, pero el personaje recorrió solo 3,1 studs; no valida una curva larga. Se probó un retorno por bioma, no todas las distancias de retorno con cada una.

## Rendimiento y regresiones

Misma preparación, 1 cliente, muestreo por Heartbeat durante la aproximación. La duración de las muestras varía con el tiempo de llegada. P95 del paso físico en ms antes/después del primer ajuste: Yoru 300, 1,06/1,04; Yuki-Onna 80, 0,74/0,82; Kaen 80, 0,87/0,72; Kaen 150, 1,02/0,81. P95 de Heartbeat: 35,46/34,04; 37,01/34,01; 36,01/34,00; 36,01/34,00 ms respectivamente. Son observaciones cortas, no una prueba de equivalencia de CPU. No se midieron de forma completa tiempo de planificación, contador de recálculos, waypoint activo ni coste en carga sostenida multijugador.

RTW_DevHarness: state 4/4, audit_multi 8/8 en sesión individual, guard_misc 10/10 incluyendo UID, muerte, respawn y refresco con huevo en mano. eggstats 11 aprobadas y 5 fallidas. Dos fallan por comparar Legendario/Mítico con pesos globales aunque EggGeneration.roll usa NestSpawnConfig.rarityWeights para el bioma. Las otras tres comparan efectos en Común/Poco común/Raro con 12% fijo mientras el generador y EffectChance dan aproximadamente 8%. No se modificaron huevos ni el harness. La animación no tuvo verificación visual independiente.

## Verificación con dos clientes y trazas finales

En los seis biomas B recogió el mismo huevo durante FAST_RETURN y quedó como único objetivo. Se observó FAST_REENGAGE sin aumento de AttackT. Cinco entraron en CHASE antes de 5 s. Akari seguía en FAST_REENGAGE al cierre de esa ventana. El cruce a Sakura dio FAST_RETURN en los cinco primeros biomas. En Infernal se probó desconexión en su lugar: objetivo vacío y huevo Available. El cruce de Infernal se había verificado en la sesión anterior. La matriz de refresco en los tres estados no se repitió en esta versión.

La traza opcional de Studio (TraceGuardianNavigation al arrancar) permite observar estado del planificador, punto de paso, velocidad solicitada, tiempo de planificación acumulado y estancamiento, como máximo cuatro muestras por segundo por guardiana en movimiento especial. Última sesión: Hana por el corredor, 4,26 s hasta CHASE, un cálculo de 0,150 s. Akari en movimiento 1,21 s, Yoru 300 en 3,00 s, Yuki-Onna 80 en 0,45 s y Kaen 150 en 0,77 s; los cuatro con cero cálculos de ruta en la última muestra. Se retiró el script de prueba y el indicador de trazas al terminar. No se publicó.
