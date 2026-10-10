odoo.define('float_to_time_convert.field_float_to_time_convert', function (require) {
    'use strict';

    var basicFields = require('web.basic_fields');
    var core = require('web.core');
    var Dialog = require('web.Dialog');
    var fieldRegistry = require('web.field_registry');

    var FieldFloat = basicFields.FieldFloat;
    var _t = core._t;
    var qweb = core.qweb;

    var FieldFloatToTimeConvert = FieldFloat.extend({
        className: 'o_field_float_to_time_convert o_field_float o_field_number',
        supportedFieldTypes: ['float'],
        events: _.extend({}, FieldFloat.prototype.events, {
            // In edit mode this widget's root element is the input itself.
            'click': '_onTimeInputClick',
            'keydown': '_onTimeInputKeydown',
            'paste': '_onTimeInputPaste',
            'drop': '_onTimeInputDrop',
        }),

        _renderEdit: function () {
            this._super.apply(this, arguments);
            this.$input
                .attr('readonly', true)
                .attr('aria-haspopup', 'dialog')
                .attr('title', _t('Choose a time'))
                .val(this._formatTime(this.value));
        },

        _renderReadonly: function () {
            this.$el.text(this._formatTime(this.value));
        },

        _formatValue: function (value) {
            return this._formatTime(value);
        },

        _formatTime: function (value) {
            if (value === false || value === null || value === undefined || value === '') {
                return '';
            }
            var parts = this._partsFromFloat(value);
            return this._formatClock(parts.hour, parts.minute, parts.period);
        },

        _partsFromFloat: function (value) {
            var numericValue = parseFloat(value);
            if (isNaN(numericValue)) {
                numericValue = 0;
            }

            var totalMinutes = Math.round(numericValue * 60);
            totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

            var hour24 = Math.floor(totalMinutes / 60);
            var minute = totalMinutes % 60;
            var period = hour24 >= 12 ? 'PM' : 'AM';
            var hour12 = hour24 % 12 || 12;

            return {
                hour: hour12,
                minute: minute,
                period: period,
            };
        },

        _formatClock: function (hour, minute, period) {
            var hourText = hour < 10 ? '0' + hour : String(hour);
            var minuteText = minute < 10 ? '0' + minute : String(minute);
            return hourText + ':' + minuteText + ' ' + period;
        },

        _positionClock: function ($content, selector, count) {
            var radius = count === 60 ? 43 : 39;
            $content.find(selector).each(function () {
                var value = parseInt($(this).attr(count === 60 ? 'data-minute' : 'data-hour'), 10);
                var index = count === 60 ? value : value % 12;
                var angle = (index * (360 / count) - 90) * Math.PI / 180;
                $(this).css({
                    left: (50 + radius * Math.cos(angle)) + '%',
                    top: (50 + radius * Math.sin(angle)) + '%',
                });
            });
        },

        _openTimePicker: function () {
            var self = this;
            var current = this._partsFromFloat(this.value);
            var hours = [];
            var minutes = [];
            var hour;
            var minute;

            for (hour = 1; hour <= 12; hour++) {
                hours.push(hour);
            }
            for (minute = 0; minute < 60; minute++) {
                minutes.push(minute);
            }

            var $content = $(qweb.render('float_to_time_convert.TimePicker', {
                hours: hours,
                minutes: minutes,
            }));
            var selected = {
                hour: current.hour,
                minute: current.minute,
                period: current.period,
            };

            var setStep = function (step) {
                var minuteStep = step === 'minute';
                $content.find('.o_fttc_hour_clock').toggleClass('o_fttc_hidden', minuteStep);
                $content.find('.o_fttc_minute_clock').toggleClass('o_fttc_hidden', !minuteStep);
                $content.find('.o_fttc_back').toggleClass('o_fttc_hidden', !minuteStep);
                $content.find('.o_fttc_step_title').text(minuteStep ? _t('Select minute') : _t('Select hour'));
            };

            var updateSelection = function () {
                $content.find('.o_fttc_hour').removeClass('active');
                $content.find('.o_fttc_hour[data-hour="' + selected.hour + '"]').addClass('active');
                $content.find('.o_fttc_minute_value').removeClass('active');
                $content.find('.o_fttc_minute_value[data-minute="' + selected.minute + '"]').addClass('active');
                $content.find('.o_fttc_period_button').removeClass('active');
                $content.find('.o_fttc_period_button[data-period="' + selected.period + '"]').addClass('active');
                $content.find('.o_fttc_preview_text').text(
                    self._formatClock(selected.hour, selected.minute, selected.period)
                );
            };

            this._positionClock($content, '.o_fttc_hour', 12);
            this._positionClock($content, '.o_fttc_minute_value', 60);
            $content.on('click', '.o_fttc_hour', function () {
                selected.hour = parseInt($(this).attr('data-hour'), 10);
                updateSelection();
                setStep('minute');
            });
            $content.on('click', '.o_fttc_minute_value', function () {
                selected.minute = parseInt($(this).attr('data-minute'), 10);
                updateSelection();
            });
            $content.on('click', '.o_fttc_back', function () {
                setStep('hour');
            });
            $content.on('click', '.o_fttc_period_button', function () {
                selected.period = $(this).attr('data-period');
                updateSelection();
            });
            updateSelection();
            setStep('hour');

            var dialog = new Dialog(this, {
                title: _t('Choose time'),
                size: 'small',
                $content: $content,
                buttons: [
                    {
                        text: _t('Cancel'),
                        close: true,
                    },
                    {
                        text: _t('Use this time'),
                        classes: 'btn-primary',
                        close: true,
                        click: function () {
                            var hour24 = selected.hour % 12;
                            if (selected.period === 'PM') {
                                hour24 += 12;
                            }
                            // Odoo 13's float field setter expects text and calls trim().
                            // It does not rerender the widget after field_changed, so
                            // refresh the visible input after the save succeeds.
                            var decimalTime = hour24 + (selected.minute / 60);
                            var displayTime = self._formatClock(
                                selected.hour,
                                selected.minute,
                                selected.period
                            );
                            self._setValue(String(decimalTime)).then(function () {
                                self.value = decimalTime;
                                if (self.$input) {
                                    self.$input.val(displayTime);
                                }
                            });
                        },
                    },
                ],
            });
            dialog.open();
        },

        _onTimeInputClick: function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (this.mode === 'edit') {
                this._openTimePicker();
            }
        },

        _onTimeInputKeydown: function (event) {
            event.preventDefault();
            event.stopPropagation();
        },

        _onTimeInputPaste: function (event) {
            event.preventDefault();
            event.stopPropagation();
        },

        _onTimeInputDrop: function (event) {
            event.preventDefault();
            event.stopPropagation();
        },
    });

    fieldRegistry.add('float_to_time_convert', FieldFloatToTimeConvert);

    return FieldFloatToTimeConvert;
});
