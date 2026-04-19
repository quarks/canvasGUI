=============================================================================
=                             canvasGUI V2                                  =
=                      created by Peter Lager 2025                          =
=                                                                           =
=     Website:  http://www.lagers.org.uk/canvasgui                          =
=     Github:   https://github.com/quarks/canvasGUI/wiki                    =
=                                                                           =
=============================================================================

*************************       Grid layout       ***************************

ABOUT GRID LAYOUTS:
In many situations you might have a collection of controls that you want to 
layout in a grid pattern. Calculating the size and position of the controls 
to provide an attractive layout is difficult to get right first time. This
leads to an iterative process of editing the controls size and position which
is very time consuming and frustrating. 

The grid layout allows you to define an imaginary grid and place the controls
in it. By changing the grid layout parameters all controls are repostioned 
and resized accordingly. The layout calculates the initial size and position
of the controls when they are first created and cannot be used to alter the
control grid appearance later.

In the example a visual representation of a 5 x 4 grid is shown. The column
widths and row heights can be adjusted by dragging the cell boundaries.

The green area shows the a control is to be placed and the bottom area
shows the source code to place a label control in that location. To change
the area simply drag over the cells to be used by the control.

Spacing between controls is determed by the horizontal and vertical insets.
The default value for the insets is 2 pixels which represents the space 
between the control edge and cell boundary. In this sketch you can change 
these to visually see their effect.

In the sketch the center section was created using a grid layout. Some areas
have a dark border to visually group controls based on their functionality.
To get the position and size of the border simply use the statement -
    grid.border(x, y, w, h)
the parameters have the same meaning as the 'grid.cell(...)' method.
