---
layout: default-bilingual
title: "Publications"
permalink: /pages/publications/
lang: en
---

# Scientific Publications

<div class="page-content">
    <div class="container">
        <h2>Research & Publications</h2>
        <p>Scientific publications and research related to the Mburicaó water monitoring project.</p>
        
        <div class="publication-card" data-aos="fade-up">
            <h4><i class="fas fa-file-pdf"></i> Machine Learning Models for Water Level Prediction in Rapid Urban Streams: Case of Mburicaó, Asunción, Paraguay</h4>
            
            <div class="authors">
                <strong>Authors:</strong> Mathias Aguilar; Héctor Velázquez; Diego H. Stalder; Andrés Wehrle; Jazmín Ojeda; Leonardo B.L. Santos
            </div>
            
            <p><strong>Abstract:</strong></p>
            <p>Urban streams in rapidly growing cities are increasingly susceptible to sudden rises in water levels during intense precipitation events due to the lack of public investment or extreme natural events. This work investigates water level peaks and significant flooding events in the Mburicaó stream in Asunción, Paraguay. We develop two predictive models using ten-minute interval data from three weather stations: a support vector machine classifier (SVM) to detect threshold-exceeding events and a multilinear regression model to estimate peak water levels. We employ mutual information analysis combined with cross-correlation between stream level and lagged precipitation to inform the selection of predictive input features. Our results indicate that with rainfall data from 40 minutes before the peak of a flood event, the regression model obtains a coefficient of determination (R² = 0.8209), an RMSE of 0.3509 meters, and a MAPE of 31.27%. While the classification model, with a 50-minute prediction horizon, targeting occurrences with peaks larger than 1.0 meters, achieves an F1-score of 0.66 with 85% recall and 54% precision. The classification performance still shows potential for improvement, especially in lowering false positives by having longer time series of data or considering hydrological models. These models could be the basis of early warning systems in data-scarce urban environments, offering a practical tool for risk mitigation in Paraguay.</p>
            
            <div class="metadata">
                <strong>Paper Details:</strong>
                <ul>
                    <li>Published in: 2025 LI Latin American Computer Conference (CLEI)</li>
                    <li>Conference Date: 27-31 October 2025</li>
                    <li>Added to IEEE Xplore: 11 March 2026</li>
                    <li>DOI: <a href="https://doi.org/10.1109/CLEI67442.2025.11420547" target="_blank">10.1109/CLEI67442.2025.11420547</a></li>
                </ul>
            </div>
        </div>

        <div class="publication-card" data-aos="fade-up">
            <h4><i class="fas fa-chalkboard"></i> ERMAC 2026 Posters</h4>
            <p>This section contains the research presented at the ERMAC 2026 conference, showcasing different facets of the Mburicaó water monitoring project.</p>
            
            <div style="margin-top: 1.5rem;">
                <!-- Poster 1: Land Cover Classification -->
                <div style="margin-bottom: 2.5rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background-color: #ffffff;">
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <img src="{{ site.baseurl }}/files/images/POSTER%20ERMAC/POSTER%20ERMAC-1.png" alt="Poster: Integrating Random Forest and Shadow Post-processing for Optimized Land Use and Land Cover Classification in GEE" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #e2e8f0; border-radius: 0.375rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>
                        <div>
                            <h5 style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.25rem;">Integrating Random Forest and Shadow Post-processing for Optimized Land Use and Land Cover Classification in GEE</h5>
                            <p style="font-size: 0.95rem; color: #475569; margin-bottom: 0.5rem;"><strong>Authors:</strong> Jazmin Ojeda Rojas, Diego H. Stalder, Andrés Wehrle, Juan Cardozo</p>
                            <p style="font-size: 0.95rem; color: #1e293b;"><strong>Abstract:</strong> This work presents a geospatial processing and machine learning approach for land cover classification in the Mburicao Stream Lower Basin using Google Earth Engine. The methodology uses a Random Forest classifier and a specialized shadow-cleaning routine to correct misclassified shadow pixels. The classification achieved an overall accuracy of 82.55% and a Kappa index of 0.7231. The results show that the lower basin comprises 48.45% vegetation, while impervious surfaces (Urban and Roads) cover nearly half of the total extent, a spatial configuration that accelerates surface runoff and explains the occurrence of flash floods.</p>
                        </div>
                    </div>
                </div>

                <!-- Poster 2: Citizen Science Platform -->
                <div style="margin-bottom: 2.5rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background-color: #ffffff;">
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <img src="{{ site.baseurl }}/files/images/PosterERMAC_VenusA_EvelynP-1/PosterERMAC_VenusA_EvelynP-1-1.png" alt="Poster: Urban Flood Monitoring and Visualization System Based on Citizen Science" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #e2e8f0; border-radius: 0.375rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>
                        <div>
                            <h5 style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.25rem;">Urban Flood Monitoring and Visualization System Based on Citizen Science</h5>
                            <p style="font-size: 0.95rem; color: #475569; margin-bottom: 0.5rem;"><strong>Authors:</strong> Venus Ayala, Evelyn Paredes, Diego H. Stalder, Jazmin Ojeda</p>
                            <p style="font-size: 0.95rem; color: #1e293b;"><strong>Abstract:</strong> This work proposes the design and implementation of an interactive web platform for urban flood monitoring and visualization based on citizen science. The system enables users to register flood events through web forms, incorporating descriptions, photographs, and geographic location. Developed with Next.js, React, Supabase, and Leaflet, the platform successfully integrates citizen participation with geospatial visualization tools. The system demonstrates the potential of citizen science to complement traditional monitoring systems and support urban risk management associated with flood events.</p>
                        </div>
                    </div>
                </div>

                <!-- Poster 3: Rainfall Prediction -->
                <div style="margin-bottom: 1rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background-color: #ffffff;">
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        <div>
                            <img src="{{ site.baseurl }}/files/images/posterERMAC_VictoriaParedes-1/posterERMAC_VictoriaParedes-1-1.png" alt="Poster: Short-Term Rainfall Prediction Applied to an Urban Basin" style="width: 100%; max-width: 600px; height: auto; border: 1px solid #e2e8f0; border-radius: 0.375rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        </div>
                        <div>
                            <h5 style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.25rem;">Short-Term Rainfall Prediction Applied to an Urban Basin</h5>
                            <p style="font-size: 0.95rem; color: #475569; margin-bottom: 0.5rem;"><strong>Authors:</strong> Victoria Paredes, Diego H. Stalder, Jazmin Ojeda, Andrés Wehrle</p>
                            <p style="font-size: 0.95rem; color: #1e293b;"><strong>Abstract:</strong> This work presents a machine learning approach for short-term rainfall prediction using pluviometric time series from automatic rainfall stations in an urban basin. Using data from five stations with 10-minute resolution, the study evaluates Linear Regression, Random Forest, and XGBoost models to predict rainfall peak intensity, event duration, and future 30-minute accumulation. Results show that tree-based models (especially XGBoost and Random Forest) outperform linear regression, indicating nonlinear relationships in rainfall dynamics. The multistation XGBoost model achieved an R² ≈ 0.56 for accumulated rainfall prediction.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


</div>