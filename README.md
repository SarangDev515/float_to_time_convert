# Float to Time Selector

Odoo 13 addon that adds the `float_to_time_convert` widget for float fields.

## Installation

1. Restart Odoo.
2. Update the Apps list in developer mode.
3. Install **Float to Time Selector**.
4. Add the widget to a float field in a view:

```xml
<field name="your_float_field" widget="float_to_time_convert"/>
```

## Behavior

- The field cannot be edited by typing, pasting, or dropping text.
- Clicking the field opens a light-blue circular clock popup.
- First choose an hour from the hour clock; the popup then changes to the minute clock.
- Choose any minute from 00 to 59 on the minute clock, then choose AM or PM below it.
- Click **Use this time** to write the value to the float field.
- The value is stored as decimal hours: `02:30 PM` is stored as `14.5`.
- The displayed value is formatted as `HH:MM AM/PM`.

The widget is intended for float fields and is active in form/list edit mode. Readonly views show the formatted time without opening the selector.
