---
layout: default-bilingual
title: "Galería"
permalink: /es/galeria/
lang: es
---

# Galería

<div class="page-content">
    <div class="container">
        <h2>Fotos y Eventos</h2>
        <p>Documentación visual de actividades de monitoreo, eventos de inundación y participación comunitaria en el proyecto Mburicaó.</p>
        
        <div class="info-box">
            <h3><i class="fas fa-images"></i> Documentación de Eventos</h3>
            <p>Esta galería contiene fotos de estaciones de monitoreo, eventos de inundación pasados y actividades de ciencia comunitaria. Estas imágenes ayudan a documentar las condiciones ambientales y proporcionan contexto visual para nuestras mediciones científicas.</p>
        </div>

        <div class="info-box" style="background: #f0f9ff; border-left: 4px solid #3b82f6;">
            <h3>Reporte del Último Evento</h3>
            <p>Para obtener información detallada sobre eventos recientes y documentación completa de eventos, visite:</p>
            <p><a href="https://www.ing.una.py/FIUNA3/?p=84962" target="_blank" style="color: #3b82f6; font-weight: 600;">FIUNA Publicaciones - Reporte del Evento Reciente <i class="fas fa-external-link-alt"></i></a></p>
        </div>


        <style>
            .gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin: 2rem 0;
            }
            
            .gallery-item {
                position: relative;
                border-radius: 1rem;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .gallery-item:hover {
                transform: translateY(-5px);
            }
            
            .gallery-item img {
                width: 100%;
                height: 250px;
                object-fit: cover;
            }
            
            .gallery-caption {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 1rem;
                text-align: center;
                font-weight: 600;
            }
        </style>
    </div>
</div>