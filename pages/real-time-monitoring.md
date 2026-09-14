---
layout: default-bilingual
title: "Real Time Monitoring"
permalink: /pages/real-time-monitoring/
lang: en
---

# Real Time Monitoring

<div class="page-content">
    <div class="container">
        <h2>Water Level & Precipitation Monitoring</h2>
        <p>Live monitoring of water levels and rainfall data from the Mburicaó stream in Asunción, Paraguay.</p>
<!-- PRONÓSTICO DEL NIVEL ... -->
<div class="pronostico-mburicao"
     data-url="https://raw.githubusercontent.com/fedemoranf-alt/mburicao-pronostico/data/forecast.json"
     data-lang="en"></div>
<script src="{{ '/assets/js/pronostico.js' | relative_url }}" defer></script>
        
        <div class="monitoring-grid">
    <div class="monitoring-item">
        <h3><i class="fas fa-water"></i> Water Level Monitoring</h3>
        <img src="https://lmeserver.tail8113d2.ts.net/panels/water-level.png" 
             alt="Water Level" 
             style="width:100%; height:auto; border:1px solid #ddd;">
    </div>
    
    <div class="monitoring-item">
        <h3><i class="fas fa-cloud-rain"></i> Precipitation Data</h3>
        <img src="https://lmeserver.tail8113d2.ts.net/panels/precipitation.png" 
             alt="Precipitation" 
             style="width:100%; height:auto; border:1px solid #ddd;">
    </div>
</div>
        
        <div class="info-box">
            <h3>About This Monitoring System</h3>
            <p>This monitoring network tracks real-time water levels and precipitation data to support early warning systems for the Mburicaó stream in Asunción. The system uses IoT sensors and machine learning models to predict flood events and support water resource management.</p>
            <p><strong>Data Update Frequency:</strong> Every 10 minutes</p>
            <p><strong>Location:</strong> Asunción, Paraguay</p>
        </div>
    </div>
</div>
