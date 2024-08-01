import React from 'react';
import DisplayOrders from '../components/Table';
import Arrow from '../components/Arrow';
import { exampleOrdersInfo } from '../../webapp/utils/example-data';

const IndexPage = () => (
  <>
    <DisplayOrders
      header='All Orders'
      operation='resolve'
      ordersInfo={exampleOrdersInfo}
      buttonText='Resolve'
      buttonColor='green'
    />
    <Arrow />
  </>
);

export default IndexPage;
