---
layout: default-bilingual
title: "Real Time Forecasting"
permalink: /pages/real-time-forecasting/
lang: en
---

# Predicciones en Tiempo Real

<div class="page-content">
    <div class="container">
        <h2>Pronóstico de Nivel de Agua</h2>
        <div class="grafana-embed">
            <iframe 
                src="{{ site.grafana_url }}/d/30yTZR8Nz/lluvia-y-nivel?orgId=2&kiosk=tv&theme=dark"
                frameborder="0"
                style="width:100%; height:600px; border-radius:8px;">
            </iframe>
        </div>
        
        <div class="info-box">
            <h3>Modelo Predictivo</h3>
            <p>Utilizamos redes neuronales LSTM entrenadas con datos históricos para predecir el comportamiento del arroyo.</p>
            <p><strong>Última actualización:</strong> <span id="update-time"></span></p>
        </div>
    </div>
</div>

<style>
    .page-content {
        padding: 120px 2rem 4rem;
    }
    
    .info-box {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        margin-top: 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
</style>

<script>
    document.getElementById('update-time').innerText = new Date().toLocaleString();
</script>