# Dear ImGui C bindings
add_library(cimgui STATIC
        cimgui.cpp
        cimgui.h
        imgui/imgui.cpp
        imgui/imgui.h
        imgui/imgui_widgets.cpp
        imgui/imgui_draw.cpp
        imgui/imgui_tables.cpp
        imgui/imgui_demo.cpp)
target_include_directories(cimgui INTERFACE ${CMAKE_CURRENT_SOURCE_DIR})
