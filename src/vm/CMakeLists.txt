cmake_minimum_required(VERSION 3.0)

set(CMAKE_CXX_COMPILER /usr/bin/clang++)
set(CMAKE_CXX_FLAGS "-std=c++17 -Wall -pedantic -Wno-c99-extensions")
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_INCLUDE_CURRENT_DIR true)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin")

project(vxvm)

add_executable(
  vxvm

  vxvm.cpp

  Array.cpp
  assemble.cpp
  Codes.cpp
  Exceptions.cpp
  frontendUtil.cpp
  Func.cpp
  Object.cpp
  readfs.cpp
  runBuiltInMethod.cpp
  Set.cpp
  Value.cpp
)
