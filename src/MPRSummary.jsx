/*
 *  Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

import axios from 'axios';
import React from 'react';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';
import { url as _url } from './config.json';

const hostUrl = _url;

class MPRSummary extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            order: 'desc',
            orderBy: '',
            tableColumnNames: ['Doc Status', 'Count'],
            sortColumns: this.props.sortColumns,
            rows: [ ['Not Started',0],['Draft Received',0],['No Draft',0],['In-progress',0],['Issues Pending',0]],
            page: 0,
            noDataMessage: this.props.noDataMessage ||
                <FormattedMessage id='table.no.results.available' defaultMessage='No results available' />,
            requirePagination: this.props.requirePagination || false,
            selectedOption: null,
            selectedProduct: null,
            selectedVersion: null,
            products: [],
            versions: []

        };

        this.props.glContainer.on('resize', () => {
            this.setState({
                width: this.props.glContainer.width,
                height: this.props.glContainer.height
            });
        }
        );

        this.handleChangeVersion = this.handleChangeVersion.bind(this);
        this.handleChangeProduct = this.handleChangeProduct.bind(this);
        this.loadVersions = this.loadVersions.bind(this);
        this.loadPRTable = this.loadPRTable.bind(this);
        this.clearTable = this.clearTable.bind(this);
        this.clearVersion = this.clearVersion.bind(this);
    }

    //changing version selector
    handleChangeVersion(selectedVersion) {
        this.setState({ selectedVersion });
        this.clearTable();
        //populate table based on (each product's) selected version
        this.loadPRTable(this.state.selectedProduct.value, selectedVersion.value);
    }

    clearTable() {
        // clear table
        let rows = [ ['Not Started',0],['Draft Received',0],['No Draft',0],['In-progress',0],['Issues Pending',0]];
        this.setState({ rows });
        console.log("clearing table");
    }

    clearVersion() {
        //reset the version selector and load versions based on product
        let selectedVersion = null;
        this.setState({ selectedVersion });
        console.log("clearing version");
    }

    //changing product selector
    handleChangeProduct(selectedProduct) {
        this.setState({ selectedProduct });
        this.clearVersion();
        this.clearTable();
        this.loadVersions(selectedProduct.value);
        console.log(`product selected:`, selectedProduct.value);
    }

    loadVersions(selectedProduct) {
        //get version based on product name
        const getVersions = hostUrl + '/versions?product=' + selectedProduct;
        axios.get(getVersions)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    // products
                    let options = response.data.data;
                    let versionArr;

                    versionArr = options.map(option => ({
                        value: option,
                        label: option
                    }));

                    this.setState({
                        versions: versionArr
                    });
                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    loadPRTable(productName, prodVersion) {
        // retrieve mpr count based on product
        let url = hostUrl + '/prcount?product=' + productName + '&version=' + prodVersion;
        axios.get(url)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    //let newRows = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
                    let newRows = [];
                    response.data.data.forEach(record => {
                        let status;
                        //this.addDocs(newRows, record.docStatus, record.count);

                        switch (record.docStatus) {
                            case 0:
                                status = 'Not Started';
                                break;
                            case 1:
                                status = 'Draft Received';
                                break;
                            case 2:
                                status = 'No Draft';
                                break;
                            case 3:
                                status = 'In-progress';
                                break;
                            case 4:
                                status = 'Issues Pending';
                                break;
                            default:
                                status = 'Invalid Status';
                                break;
                        }
                        newRows.push([status, record.count])
                        //newRows.push([record.docStatus, record.count])
                    })

                    this.setState({ rows: newRows });

                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });

    }

    loadProducts(){

        // Load product names when the page is loading
        const getProductsUrl = hostUrl + '/products';
        axios.get(getProductsUrl)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    // products
                    let options = response.data.data;
                    let productArr;

                    productArr = options.map(option => ({
                        value: option,
                        label: option
                    }));

                    this.setState({
                        products: productArr
                    });
                } else {
                    console.log("No data in products.");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });
    }

    addDocs(docArr, docStatus, docCount) {
        for (let key in docArr) {
            if (docArr[key] == docArr[docStatus]) {
                docArr[key] = docCount;
            }
        }
    }

    componentDidMount() {

        this.loadProducts();



        // retrieve totl mpr count based on product
        let url2 = 'http://localhost:9090/totalprcount?product=Analytics&version=4.1.0';

        axios.get(url2)
            .then(response => {
                if (response.hasOwnProperty("data")) {
                    console.log("count:", response.data.data.count)
                } else {
                    console.log("no data");
                }
            })
            .catch(error => {
                this.setState({
                    faultyProviderConf: true
                });
            });



    }

    /**
        * render custom table
        * */
    render() {
        const { rows } = this.state;

        return (
            <div>
                <Select
                    value={this.state.selectedProduct}
                    onChange={this.handleChangeProduct}
                    options={this.state.products}
                    placeholder="Product"
                />

                <Select
                    value={this.state.selectedVersion}
                    onChange={this.handleChangeVersion}
                    options={this.state.versions}
                    placeholder="Version"
                />

                <Paper>
                    <div>
                        <Table>
                            <TableHead>
                                <TableCell> Doc Status </TableCell>
                                <TableCell> MPR count </TableCell>
                            </TableHead>
                            <TableBody>
                                {rows.map(row => {
                                    return (
                                        <TableRow>
                                            {row.map((data) => {
                                                return (
                                                    <TableCell> {data} </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Paper>
            </div>
        );
    }
}

global.dashboard.registerWidget('MPRSummary', MPRSummary);