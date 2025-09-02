const models = [
  {
    id: 'm1',
    model: 'VFD-1000',
    type: 'General Purpose',
    power: '0.5 - 2.2 kW',
    description: 'Compact VFD suitable for small motors.',
    images: ['/assets/teco_ref1.png','/assets/vfd-1000-2.jpg'],
    pdf: '/assets/TECO-a510s.pdf',
    voltage: '220V',
    current: '5A',
    notes: 'Check wiring diagram for terminal assignments.'
  },
  {
    id: 'm2',
    model: 'VFD-2000',
    type: 'Heavy Duty',
    power: '3 - 15 kW',
    description: 'Designed for industrial applications.',
    images: ['/assets/vfd-2000-1.jpg'],
    pdf: '/assets/vfd-2000-manual.pdf',
    voltage: '380V',
    current: '30A',
    notes: 'Cooling fan maintenance recommended every 6 months.'
  }
]

export default models
