# -*- coding: utf-8 -*-
{
    'name': 'Float to Time Selector',
    'summary': 'Select a time for float fields using an AM/PM clock popup.',
    'description': """
        Adds the float_to_time_convert widget for float fields. The field is
        read-only for direct keyboard entry and can only be changed through a
        time picker popup with hour, minute, and AM/PM controls.
    """,
    'version': '13.0.1.0.9',
    'category': 'Tools',
    'author': 'Sarang T',
    'license': 'LGPL-3',
    'images': ['static/description/icon.png'],
    'depends': ['web'],
    'data': [
        'views/assets.xml',
    ],
    'qweb': [
        'static/src/xml/float_to_time_convert.xml',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
