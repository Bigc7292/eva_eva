'use client'

import React from 'react'
import { CalendarIcon, PhoneIcon, UsersIcon, BuildingIcon, DashboardIcon, BarChart3, Target, Phone } from './components/ui/icons'

// Test each icon individually
export default function TestIcons() {
  return (
    <div>
      <h1>Icon Test</h1>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <p>CalendarIcon:</p>
          {CalendarIcon && <CalendarIcon />}
          {!CalendarIcon && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>PhoneIcon:</p>
          {PhoneIcon && <PhoneIcon />}
          {!PhoneIcon && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>UsersIcon:</p>
          {UsersIcon && <UsersIcon />}
          {!UsersIcon && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>BuildingIcon:</p>
          {BuildingIcon && <BuildingIcon />}
          {!BuildingIcon && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>DashboardIcon:</p>
          {DashboardIcon && <DashboardIcon />}
          {!DashboardIcon && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>BarChart3:</p>
          {BarChart3 && <BarChart3 />}
          {!BarChart3 && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>Target:</p>
          {Target && <Target />}
          {!Target && <p>UNDEFINED</p>}
        </div>
        <div>
          <p>Phone:</p>
          {Phone && <Phone />}
          {!Phone && <p>UNDEFINED</p>}
        </div>
      </div>
    </div>
  )
}