# AutoComplete for Mendix

This widget is a wrapper for the [Clockpicker plugin](http://weareoutman.github.io/clockpicker/)  allowing a user to select a time using a clock face.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Typical usage scenario

Where a user needs to input a time.

# Configuration

## Data Source
- **DateTime attribute**: The attribute to use for the selected time.

## Display
- **Show Label**: Whether a label should be displayed for the field.
- **Label Caption**: The text to be displayed in the label (only used if Show Label is set to Yes)
- **Form Orientation**: 'Horizontal' or 'Vertical' (should match the DataView's Form Orientation value)
- **Label Width**: A value between 1 and 11 that determines the width of the label. Will be reset to 1 or 11 if a value is selected that is outside these bounds. (only used if Show Label is set to Yes and Form Orientation is set to Horizontal)
- **Time format**: '12 Hour' or '24 Hour'.
- **Enable Auto Close**: Whether the picker should close automatically on selection of a minutes value (if false, user needs to click a 'Done' button)
- **'Done' text**: The caption for the button displayed if Auto Close is false.

## Events
- **On change**: The microflow that will be run when an item is selected or the control is cleared.

# Known Issues

See [here](https://github.com/AuraQ/ClockPickerForMendix/issues) for all outstanding issues or to raise a new issue, enhancement etc.