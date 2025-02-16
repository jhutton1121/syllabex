"use client";

import React from 'react';
import './styles.css';

export default function StudentDashboard() {
    return ( 
    
    <div className='dash-container'>
      <div className="top">       
          <img className='logo' src="/media/logo.png" alt="Syllabex Logo" /> 
              <h1 className='dash-heading'>
                  Hello syllabex
              </h1>
          <hr className='separator'></hr>
        </div>
        

      <div className='left'>
        Hello World
      </div>

      <div className='main'>
        Hi again
      </div>

      </div>
    )
}
