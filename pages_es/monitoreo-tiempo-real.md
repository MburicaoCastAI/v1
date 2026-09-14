---
layout: default-bilingual
title: "Monitoreo en Tiempo Real"
permalink: /es/monitoreo-tiempo-real/
lang: es
---

# Monitoreo en Tiempo Real

<div class="page-content">
    <div class="container">
        <h2>Monitoreo de Nivel de Agua y Precipitación</h2>
        <p>Monitoreo en vivo de niveles de agua y datos de precipitación del Arroyo Mburicaó en Asunción, Paraguay.</p>
    <!-- PRONÓSTICO DEL NIVEL ... -->
    <div class="pronostico-mburicao"
            data-url="https://raw.githubusercontent.com/fedemoranf-alt/mburicao-pronostico/data/forecast.json"
            data-lang="es"></div>
    <script src="{{ '/assets/js/pronostico.js' | relative_url }}" defer></script>
        
        <div class="monitoring-grid">
            <!-- Panel de precipitación de Grafana: comentado el 14-sep. La lluvia ahora está en el recuadro del pronóstico con la cuenta correcta; este panel daba 12 veces más. Para volver a mostrarlo, borrar esta línea y la de cierre.
            <div class="monitoring-item">
                <h3><i class="fas fa-water"></i> Monitoreo de Nivel de Agua</h3>
                <img src="https://lmeserver.tail8113d2.ts.net/panels/water-level.png" 
             alt="Water Level" 
             style="width:100%; height:auto; border:1px solid #ddd;">
            </div>
            -->
            <div class="monitoring-item">
                <h3><i class="fas fa-cloud-rain"></i> Datos de Precipitación</h3>
                <img src="https://lmeserver.tail8113d2.ts.net/panels/precipitation.png" 
             alt="Precipitation" 
             style="width:100%; height:auto; border:1px solid #ddd;">
            </div>
        </div>
        
        <div class="info-box">
            <h3>Acerca de Este Sistema de Monitoreo</h3>
            <p>Esta red de monitoreo realiza el seguimiento en tiempo real de los niveles de agua y datos de precipitación para apoyar sistemas de alerta temprana del Arroyo Mburicaó en Asunción. El sistema utiliza sensores IoT y modelos de aprendizaje automático para predecir eventos de inundación y apoyar la gestión de recursos hídricos.</p>
            <p><strong>Frecuencia de Actualización de Datos:</strong> Cada 10 minutos</p>
            <p><strong>Ubicación:</strong> Asunción, Paraguay</p>
        </div>
    </div>
</div>
