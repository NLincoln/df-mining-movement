import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const GRID_SIZE = 10;

class Square extends Component {
  render() {
    const { props } = this;
    const { children, ...other } = props;
    return (
      <rect height="20" width="20" {...other}>  
        {children}
      </rect>
    )
  }
}

const renderGrid = (grid) => (props) => {
  const flat = grid
  .reduce((prev, curr) => curr.concat(prev), []);
  return (
    <g>
      {flat.map((elem) => {
        const { x, y, ...other } = elem;
        return <Square x={x * 30} y={y * 30} {...other} {...props}/>;
      })}
    </g>
  )
};

const initGrid = ({ height, width }) => {
  return Array.from(new Array(height)).map((_, i) => {
    return Array.from(new Array(width)).map((__, j) => {
      return {
        x: j,
        y: i,
        isMined: i === 0 && j === 0
      };
    });
  });
};

const initDwarves = () => {
  return [{
    x: 0,
    y: 0,
    mining: {
      x: 0,
      y: 1
    }
  }]
};
const hasDwarf = (dwarves) => ({ x, y }) => 
  dwarves.some((dwarf) => 
    dwarf.x === x && dwarf.y === y
  );
const isMining = (dwarves) => ({ x, y }) =>  
  dwarves.some((dwarf) => 
    dwarf.mining && dwarf.mining.x === x && dwarf.mining.y === y
  );


const findSquare = (pred) => (point) => {
  const ring = (size) => {
    for (let x = (-size) + point.x; x <= size + point.x; ++x) {
      for (let y = (-size) + point.y; y <= size + point.y; ++y) {
        if (pred({ x, y })) {
          return {
            x, y
          };
        }
      }
    }
    if (size > GRID_SIZE) {
      return point;
    }
    return ring(size + 1);
  };
  return ring(1);
};

const oobCheck = (pred) => (point) => {
  if (point.x >= 0 && point.y >= 0 && point.x < GRID_SIZE && point.y < GRID_SIZE) {
    return pred(point);
  }
  return false;
}

const isAdjacent = (a, b) => Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;

const clamp = (min, max) => num => Math.min(Math.max(num, min), max);

const stepTowards = (start, target) => {
  if (isAdjacent(start, target)) {
    return target;
  }
  const step = (val, t) => clamp(val - 1, val + 1)(t);
  return {
    x: step(start.x, target.x),
    y: step(start.y, target.y)
  };
};

const stateStep = ({ dwarves, grid }) => {
  const mining = isMining(dwarves);
  const has = hasDwarf(dwarves);
  const isAlreadyMined = (grid) => (point) => {
    return grid
    .some((row) => row.some((elem) => 
      elem.isMined && elem.x === point.x && elem.y === point.y
    ))
  };

  const checkMined = isAlreadyMined(grid);

  const getNextMining = findSquare(oobCheck((point) => {
    return !checkMined(point) && !mining(point);
  }));
  const nextGrid = grid.map((row) => row.map((elem) => {
    const nextElem = { ...(elem) };
    if (mining(elem)) {
      nextElem.isMined = true;
    }
    return nextElem;
  }));
  const nextDwarves =  dwarves.map((dwarf) => {
    const nextMining = getNextMining(dwarf);
    if (dwarf.moving && !isAdjacent(dwarf, dwarf.moving)) {
      const next = stepTowards(dwarf, dwarf.moving);
      return {
        ...next,
        moving: { ...(dwarf.moving)}
      };
    }
    const getNextStanding = findSquare(oobCheck((point) => {
      return point.x !== nextMining.x && point.y !== nextMining.y && !has(point) && isAlreadyMined(nextGrid)(point);
    }));
    const nextStanding = getNextStanding(nextMining);
    if (!isAdjacent(dwarf, nextStanding)) {
      return {
        ...(stepTowards(dwarf, nextStanding)),
        moving: { ...nextStanding }
      }
    } else if (isAdjacent(dwarf, nextMining)) {
      return {
        ...dwarf,
        mining: nextMining,
        moving: null
      };
    }
    return {
      ...nextStanding,
      mining: {
        ...nextMining
      }
    }
  });
  return {
    dwarves: nextDwarves,
    grid: nextGrid,
  }
};

const toggleMined = ({ grid }) => ({ x, y }) => {
  return {
    grid: grid.map((row) => row.map((elem) => {
      if (elem.x === x && elem.y === y) {
        return {
          ...elem,
          isMined: !elem.isMined
        };
      }
      return elem;
    }))
  }
};

class App extends Component {
  state = {
    grid: null,
    dwarves: []
  }

  constructor() {
    super(...arguments);
    this.state = {
      grid: initGrid({ height: GRID_SIZE, width: GRID_SIZE }),
      dwarves: initDwarves()
    }
    setInterval(() => this.setState(stateStep), 1000);
  }
  render() {
    const has = hasDwarf(this.state.dwarves);
    const mining = isMining(this.state.dwarves);
    const toggle = toggleMined(this.state);
    const grid = this.state.grid
    .map((row) => row.map((elem) => {
      return {
        ...elem,
        fill: has(elem) ? "black" : mining(elem) ? "green" : elem.isMined ? "blue" : "red",
        onClick: () => this.setState(toggle(elem))
      }
    }));
    const Grid = renderGrid(grid);
    return (
      <svg>
        <Grid/>
      </svg>
    );
  }
}

export default App;
