/* Coordinates are percentages of the original image, keyed by comparison case.
 * toy-reference is reused for toys and books, with different highlights. */
const goalAnnotations = {
  'goal-position-a': [{ rect: [49.4, 48.7, 7.8, 32.2], label: 'In front of green' }],
  'goal-position-b': [{ rect: [38.6, 34.5, 9.2, 34.9], label: 'On purple' }],
  'desk-upper': [{ rect: [28.9, 30.2, 25.3, 25.8], label: 'Upper drawer' }],
  'desk-middle': [{ rect: [33.2, 25.3, 23.5, 26.1], label: 'Middle drawer' }],
  'toy-reference': [
    { rect: [22.8, 17.8, 26.3, 33.5], label: 'Cars in blue' },
    { rect: [48.4, 16, 25.7, 33.2], label: 'Plush in white' }
  ],
  'toy-swap': [
    { rect: [24.1, 12.1, 25.5, 36.1], label: 'Plush in blue' },
    { rect: [48.9, 15.9, 25.6, 32.4], label: 'Cars in white' }
  ],
  'desk-holders-a': [
    { rect: [42.9, 28.4, 8.3, 20], label: 'Glue left', align: 'end' },
    { rect: [56.3, 30.7, 9.3, 19.1], label: 'Pens right' }
  ],
  'desk-holders-b': [
    { rect: [39.6, 25.9, 8.6, 18.7], label: 'Pens left', align: 'end' },
    { rect: [53, 27.9, 8.4, 18.7], label: 'Glue right' }
  ],
  'toy-reference-books': [{ rect: [45.4, 61, 12.4, 29.2], label: 'Green on top' }],
  'toy-books': [{ rect: [63.1, 51.9, 16.8, 32.3], label: 'Purple on top' }],
  'human-books-right': [{ rect: [84, 21.8, 11.1, 35], label: 'Right slot', align: 'end' }],
  'human-books-left': [{ rect: [72.4, 10.4, 10.9, 38.2], label: 'Left slot', align: 'end', placement: 'below' }],
  'human-mug-monitor': [{ rect: [8.8, 30.7, 12.3, 24.4], label: 'Near monitor' }],
  'human-mug-rack': [{ rect: [57, 48.9, 9.8, 23.6], label: 'Near file rack' }]
};
