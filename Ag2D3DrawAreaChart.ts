import {AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {chartConfig} from "../../../../../@types/d3Chart/index";
import * as D3 from 'D3';
import * as moment from 'moment';

@Component({
  selector: 'd3-chart',
  templateUrl: './d3-chart.component.html',
  styleUrls: ['./d3-chart.component.css']
})
export class D3ChartComponent implements OnChanges, AfterViewInit {
  @Input() config: Array<chartConfig> = [];
  @ViewChild('container') el: ElementRef;

  htmlElement: HTMLElement;
  d3Host;
  margin = {top: 0, right: 0, bottom: 0, left: 0};
  width: number;
  height: number;
  xScale;
  yScale;
  svg;
  xAxis;
  yAxis;

  constructor() {
  }

  ngAfterViewInit() {
    this.htmlElement = this.el.nativeElement;
    this.d3Host = D3.select(this.htmlElement);
    D3.csv('https://hyllesen.github.io/test.csv', (error, datas) => {
      const dataCollection = datas.map(data => {
        return { x: new Date(data.date), y: data.close };
      })
      this.config.push({
        setting: {
          fill: 'lightsteelblue',
          interpolation: D3.curveLinear
        }, dataset: dataCollection
      });
      this.ngOnChanges();
    });
    this.setUp();
  }

  ngOnChanges() {
    if (!this.config || this.config.length === 0 || !this.d3Host) return;
    this.setUp();
    this.buildSVG();
    this.populate();
    this.drawXAxis();
    this.drawYAxis();
  }

  setUp(): void {
    this.margin = {top: 20, right: 20, bottom: 40, left: 40};
    this.width = this.htmlElement.clientWidth  - this.margin.left - this.margin.right;
    this.height = this.width * 0.5 - this.margin.top - this.margin.bottom;
    this.xScale = D3.scaleTime().range([0, this.width]);
    this.yScale = D3.scaleLinear().range([this.height, 0]);
  }

  buildSVG() {
    this.d3Host.html('');
    this.svg = this.d3Host.append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  }

  populate(): void{
    this.config.forEach((area) => {
      this.xScale.domain(D3.extent(area.dataset, (d) => d.x));
      this.yScale.domain([0, this.getMaxY()]);
      this.svg.append('path')
        .datum(area.dataset)
        .attr('class', 'area')
        .style('fill', area.setting.fill)
        .attr('d', D3.area()
          .x((d: any) => this.xScale(d.x))
          .y0(this.height)
          .y1((d: any) => this.yScale(d.y))
          .curve(D3.curveNatural));
      // this.svg.append('path')
      //   .datum(area.dataset)
      //   .attr('class', 'line')
      //   .style('fill', area.setting.fill)
      //   .attr('d', D3.line()
      //     .x(function(d: any){
      //       return x(d.x);
      //     })
      //     .y((d: any) => this.xScale(d.y))
      //     .curve(D3.curveNatural));
    })
  }

  drawXAxis(){
    this.xAxis = D3.axisBottom(this.xScale)
      .tickFormat(t => moment(t).format('MMM').toUpperCase())
      .tickPadding(15);
    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, '+this.height+')')
      .call(this.xAxis);
  }

  drawYAxis(){
    this.yAxis = D3.axisLeft(this.yScale).tickPadding(10);
    this.svg.append('g').attr('class', 'y axis').call(this.yAxis).append('text').attr('transform', 'rotate(-90)');
  }

  getMaxY(): number{
    let maxValueOfArray=[];
    this.config.forEach(data => maxValueOfArray.push(Math.max.apply(Math, data.dataset.map(d => d.y))));
    return Math.max(...maxValueOfArray);
  }
}
