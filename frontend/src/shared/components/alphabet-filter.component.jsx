import React from "react";

const AlphabetFilter = ({ onFilter, columnName }) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleFilter = (letter) => {
    if (letter === "Show All") {
      onFilter(null); // Reset filter
    } else {
      onFilter({
        column: columnName,
        value: letter,
      });
    }
  };

  return (
    <div className="inside_area_ctn btm_gap">
      <div className="pregination">
        <div>
          {alphabet.map((letter) => (
            <a
              href="#"
              key={letter}
              onClick={(e) => {
                e.preventDefault();
                handleFilter(letter);
              }}
            >
              {letter}
            </a>
          ))}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleFilter("Show All");
            }}
          >
            Show All
          </a>
        </div>
      </div>
    </div>
  );
};

export default AlphabetFilter;
